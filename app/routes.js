import { index, route, layout } from "@react-router/dev/routes";

export default [
  // Auth sayfaları (layout dışında, çünkü header/sidebar olmasın)
  route("login", "routes/login.jsx"),
  route("register", "routes/register.jsx"),
  route("logout", "routes/logout.jsx"),


  layout("routes/_layout.jsx", [
    index("routes/home.jsx"),
    route("inventory", "routes/inventory.jsx"),
    route("inventory/new", "routes/inventory_add.jsx"),
    route("inventory/:itemId/edit", "routes/inventory_edit.jsx"),
    route("inventory/:itemId/waste", "routes/inventory_waste.jsx"),
    route("inventory/:itemId/consume", "routes/inventory_consume.jsx"),
    route("inventory/actions", "routes/inventory_actions.jsx"),
    route("shopping", "routes/shopping.jsx"),
    route("shopping/actions", "routes/shopping_actions.jsx"),
    route("kitchen", "routes/kitchen.jsx"),
    route("history", "routes/history.jsx"),
    route("waste", "routes/waste.jsx"),
    route("stats", "routes/stats.jsx"),
  ]),
];