import { HandoffSearch } from "./handoff_search.js";
import { createInfraiAi } from "./infrai_ai.js";

const search = new HandoffSearch(createInfraiAi());

await search.index({
  id: "asset-brand-kit",
  orderId: "order-1042",
  sellerId: "seller-studio",
  buyerId: "buyer-northwind",
  kind: "seller_asset",
  title: "Final brand kit",
  content: "Logo exports are SVG and PNG. The charcoal wordmark is the default for light backgrounds."
});

await search.index({
  id: "update-print",
  orderId: "order-1042",
  sellerId: "seller-studio",
  buyerId: "buyer-northwind",
  kind: "buyer_update",
  title: "Print preference",
  content: "The buyer confirmed the one-color mark for packaging and requested the CMYK export."
});

const result = await search.search({
  orderId: "order-1042",
  buyerId: "buyer-northwind",
  query: "Which logo files should the packaging team receive?",
  limit: 2
});

console.log(JSON.stringify(result, null, 2));
