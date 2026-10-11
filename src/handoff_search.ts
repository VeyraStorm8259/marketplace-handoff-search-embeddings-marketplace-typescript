import { z } from "zod";

export const documentInput = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  sellerId: z.string().min(1),
  buyerId: z.string().min(1),
  kind: z.enum(["seller_asset", "buyer_update"]),
  title: z.string().min(1),
  content: z.string().min(1)
});

export const searchInput = z.object({
  orderId: z.string().min(1),
  buyerId: z.string().min(1),
  query: z.string().min(1),
  limit: z.number().int().min(1).max(10).default(4)
});

export type MarketplaceDocument = z.infer<typeof documentInput>;
export type SearchRequest = z.infer<typeof searchInput>;
export type EmbeddedDocument = MarketplaceDocument & { embedding: number[] };
export type SearchHit = MarketplaceDocument & { score: number };

export interface HandoffAi {
  embed(input: string | string[]): Promise<number[][]>;
  summarize(query: string, hits: SearchHit[]): Promise<string>;
}

function cosine(left: number[], right: number[]): number {
  if (left.length !== right.length || left.length === 0) return -1;
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] ** 2;
    rightNorm += right[index] ** 2;
  }
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm) || 1);
}

export class HandoffSearch {
  private readonly documents = new Map<string, EmbeddedDocument>();
  private readonly ai: HandoffAi;

  constructor(ai: HandoffAi) {
    this.ai = ai;
  }

  async index(document: MarketplaceDocument): Promise<void> {
    const [embedding] = await this.ai.embed(`${document.title}\n${document.content}`);
    this.documents.set(document.id, { ...document, embedding });
  }

  async search(request: SearchRequest): Promise<{ hits: SearchHit[]; handoff: string }> {
    const [queryEmbedding] = await this.ai.embed(request.query);
    const hits = [...this.documents.values()]
      .filter((document) => document.orderId === request.orderId && document.buyerId === request.buyerId)
      .map(({ embedding, ...document }) => ({ ...document, score: cosine(queryEmbedding, embedding) }))
      .sort((left, right) => right.score - left.score)
      .slice(0, request.limit);

    const handoff = await this.ai.summarize(request.query, hits);
    return { hits, handoff };
  }
}
