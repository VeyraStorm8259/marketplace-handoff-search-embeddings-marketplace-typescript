import assert from "node:assert/strict";
import test from "node:test";
import { HandoffSearch, type HandoffAi } from "../src/handoff_search.js";

const vectors: Record<string, number[]> = {
  "Packaging files\nCMYK logo for the carton": [1, 0],
  "Private note\nUnrelated draft": [1, 0],
  "Which packaging logo is final?": [1, 0]
};

const fakeAi: HandoffAi = {
  async embed(input) {
    const values = typeof input === "string" ? [input] : input;
    return values.map((value) => vectors[value] ?? [0, 1]);
  },
  async summarize(_query, hits) {
    return hits.map((hit) => hit.title).join(", ");
  }
};

test("handoff search keeps another buyer's order documents out of the answer", async () => {
  const search = new HandoffSearch(fakeAi);
  await search.index({ id: "allowed", orderId: "order-7", sellerId: "seller-1", buyerId: "buyer-a", kind: "seller_asset", title: "Packaging files", content: "CMYK logo for the carton" });
  await search.index({ id: "private", orderId: "order-7", sellerId: "seller-1", buyerId: "buyer-b", kind: "buyer_update", title: "Private note", content: "Unrelated draft" });

  const result = await search.search({ orderId: "order-7", buyerId: "buyer-a", query: "Which packaging logo is final?", limit: 5 });

  assert.deepEqual(result.hits.map((hit) => hit.id), ["allowed"]);
  assert.equal(result.handoff, "Packaging files");
});
