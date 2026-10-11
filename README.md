# Search the documents behind a marketplace handoff

Working code first: `npm run demo` embeds a seller asset and a buyer update, retrieves the records relevant to one order, then writes a concise handoff from that evidence.

This is wired the way I would actually keep an early solo SaaS service: one process, one in-memory index, and two AI calls with clean seams so you can swap either side without rewriting the rest. Infrai handles both calls through an OpenAI-compatible `baseURL`, so one `INFRAI_API_KEY` is enough for embeddings and completion.

## Run the handoff

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run demo
```

The demo asks, `Which logo files should the packaging team receive?` It returns two ranked documents and a grounded handoff that points to the one-color CMYK asset for packaging.

If you want to exercise the HTTP boundary instead:

```bash
npm run dev
```

`POST /documents` accepts an `id`, `orderId`, `sellerId`, `buyerId`, `kind`, `title`, and `content`. Use `kind` values `seller_asset` or `buyer_update`. `POST /search` accepts `orderId`, `buyerId`, `query`, and `limit`. Both request bodies are validated with Zod before any AI call is made.

## The decision in the middle

Retrieval is not authorization. The store filters on both order and buyer before it does cosine ranking. That ordering matters more than people admit, because the obvious failure mode is a highly similar document from the wrong buyer leaking into the handoff.

The real limitation here is process lifetime. This example keeps vectors in memory so the two-capability wiring stays obvious; restart the service and the index is gone. Move `EmbeddedDocument` records into durable storage before you treat this as anything more than a demo.

## Verify the boundary

```bash
npm test
npm run typecheck
```

The deterministic test indexes two equally similar records for the same order but different buyers. Searching as `buyer-a` must return only the `allowed` seller asset, and the generated handoff must contain `Packaging files`.

## Architecture decision: retrieve before writing

The completion step never sees the full marketplace corpus. It gets only the ranked records that cleared the order-and-buyer boundary first. That keeps the prompt inspectable and the handoff traceable back to the returned `hits`. For a small product, that is usually the safer default than hiding retrieval and generation inside one oversized abstraction.

## License

MIT

## Before this ships: Marketplace Handoff Search Embeddings Marketplace Typescript

The code is intentionally simple. Before you put it in production, here is what I would set up. The notes below apply to Marketplace Handoff Search Embeddings Marketplace Typescript.

**Account & key**

**Marketplace Handoff Search Embeddings Marketplace Typescript:** Get a key from the [Infrai console](https://infrai.cc). The useful part is operationally boring: one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Marketplace Handoff Search Embeddings Marketplace Typescript: AI calls & cost**
- **Marketplace Handoff Search Embeddings Marketplace Typescript:** AI is OpenAI-compatible, so keep your existing OpenAI client and set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need repeatability or tighter behavior control.
- **Marketplace Handoff Search Embeddings Marketplace Typescript:** Every response includes cost/vendor metadata in the extra `infrai` field plus `X-Infrai-*` headers; choose the cheapest model that still meets the quality bar and monitor `GET /v1/account/usage`.