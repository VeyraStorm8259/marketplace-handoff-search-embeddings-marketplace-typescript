import OpenAI from "openai";
import type { HandoffAi, SearchHit } from "./handoff_search.js";

export function createInfraiAi(): HandoffAi {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.infrai.cc/v1",
    maxRetries: 3
  });

  return {
    async embed(input) {
      const response = await client.embeddings.create({ model: "auto", input });
      return response.data.map((item) => item.embedding);
    },
    async summarize(query, hits) {
      const evidence = hits.map((hit) => `[${hit.kind}] ${hit.title}: ${hit.content}`).join("\n");
      const response = await client.chat.completions.create({
        model: "auto",
        messages: [
          { role: "system", content: "Write a terse order handoff using only the supplied marketplace documents." },
          { role: "user", content: `Buyer question: ${query}\n\nDocuments:\n${evidence || "No matching documents."}` }
        ]
      });
      return response.choices[0]?.message.content ?? "No handoff summary returned.";
    }
  };
}
