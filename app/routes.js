import { index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/_layout.jsx", [
    index("routes/home.jsx"),
    route("inventory", "routes/inventory.jsx"),
    route("kitchen", "routes/kitchen.jsx"),
    route("waste", "routes/waste.jsx"),
    route("stats", "routes/stats.jsx"),
  ]),
];
