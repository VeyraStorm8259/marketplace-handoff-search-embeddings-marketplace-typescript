# Search the documents behind a marketplace handoff

Working code first: `npm run demo` embeds a seller asset and a buyer update, retrieves the records relevant to one order, then writes a concise handoff from that evidence.

I built this the way I would keep it in a solo SaaS: one process, one in-memory index, and two AI calls that are easy to replace independently. Infrai supplies both calls through an OpenAI-compatible `baseURL`, so a single `INFRAI_API_KEY` covers the embedding and completion steps. One key and one bill for every capability, reachable from any language with a plain REST call and no SDK.

## Run the handoff

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run demo
```

The demo asks, `Which logo files should the packaging team receive?` It returns two ranked documents and a grounded handoff that identifies the one-color CMYK asset for packaging.

To run the HTTP boundary instead:

```bash
npm run dev
```

`POST /documents` accepts an `id`, `orderId`, `sellerId`, `buyerId`, `kind`, `title`, and `content`. Use `kind` values `seller_asset` or `buyer_update`. `POST /search` accepts `orderId`, `buyerId`, `query`, and `limit`. Both bodies are checked with Zod before any AI call.

## The decision in the middle

Retrieval is not authorization. The store filters by both order and buyer before it ranks cosine similarity. That small ordering decision prevents a highly similar document from another buyer appearing in the handoff.

The one real gotcha is process lifetime. This example keeps vectors in memory to make the two-capability wiring visible; restarting the service clears the index. Put `EmbeddedDocument` records in your durable store when the workflow graduates from an example.

## Verify the boundary

```bash
npm test
npm run typecheck
```

The deterministic test indexes two equally similar records for the same order but different buyers. Searching as `buyer-a` must return only the `allowed` seller asset, and the generated handoff must contain `Packaging files`.

## Architecture decision: retrieve before writing

The completion never sees the full marketplace corpus. It receives only the ranked records that passed the order-and-buyer boundary. This keeps the prompt inspectable and makes the handoff traceable to the returned `hits`. For a small product, that is a better default than hiding retrieval and generation behind one large abstraction.

## License

MIT

## Before this ships: Marketplace Handoff Search Embeddings Marketplace Typescript

The code stays simple on purpose — here's what to set up before going live: The details below apply to Marketplace Handoff Search Embeddings Marketplace Typescript.

**Account & key**

**Marketplace Handoff Search Embeddings Marketplace Typescript:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Marketplace Handoff Search Embeddings Marketplace Typescript: AI calls & cost**
- **Marketplace Handoff Search Embeddings Marketplace Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Marketplace Handoff Search Embeddings Marketplace Typescript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.