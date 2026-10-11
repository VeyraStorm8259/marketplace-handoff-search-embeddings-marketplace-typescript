import { createServer, type ServerResponse } from "node:http";
import OpenAI from "openai";
import { ZodError } from "zod";
import { HandoffSearch, documentInput, searchInput } from "./handoff_search.js";
import { createInfraiAi } from "./infrai_ai.js";

const search = new HandoffSearch(createInfraiAi());

function send(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

async function readBody(request: AsyncIterable<Buffer>): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/documents") {
      const document = documentInput.parse(await readBody(request));
      await search.index(document);
      send(response, 201, { documentId: document.id, state: "indexed" });
      return;
    }
    if (request.method === "POST" && request.url === "/search") {
      const query = searchInput.parse(await readBody(request));
      send(response, 200, await search.search(query));
      return;
    }
    send(response, 404, { error: "Route not found" });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      send(response, 400, { error: "Invalid request body" });
      return;
    }
    if (error instanceof OpenAI.APIError && error.status && error.status >= 400 && error.status < 500) {
      send(response, error.status, { error: error.message });
      return;
    }
    console.error(error);
    send(response, 502, { error: "AI request failed" });
  }
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => console.log(`Marketplace search listening on http://localhost:${port}`));
