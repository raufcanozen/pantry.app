import { index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/_layout.jsx", [
    index("routes/home.jsx"),
    route("inventory", "routes/inventory.jsx"),
    route("inventory/new", "routes/inventory_add.jsx"),
    route("inventory/:itemId/edit", "routes/inventory_edit.jsx"),
    route("inventory/:itemId/waste", "routes/inventory_waste.jsx"),
    route("inventory/actions", "routes/inventory_actions.jsx"),
    route("kitchen", "routes/kitchen.jsx"),
    route("waste", "routes/waste.jsx"),
    route("stats", "routes/stats.jsx"),
  ]),
];