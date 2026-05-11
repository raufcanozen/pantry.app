import { Outlet, NavLink, Link, useLoaderData } from "react-router";
import { Refrigerator, Snowflake, Archive, DoorClosed } from "lucide-react";
import { prisma } from "~/db.server";

export async function loader() {
  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });
  const totalItems = await prisma.item.count({
    where: { consumedAt: null },
  });
  return { locations, totalItems };
}

const locationIcons = {
  "Buzdolabı": Refrigerator,
  "Dondurucu": Snowflake,
  "Kiler": Archive,
  "Dolap": DoorClosed,
};

export default function Layout() {
  const { locations, totalItems } = useLoaderData();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <h1 className="text-xl font-bold text-slate-800 group-hover:text-emerald-700 transition">
              Dolapta Ne Var?
            </h1>
            <span className="text-sm text-slate-400">
              ({totalItems} ürün)
            </span>
          </Link>

          <nav className="flex gap-1">
            <NavTab to="/inventory" label="Envanter" />
            <NavTab to="/kitchen" label="Mutfak" />
            <NavTab to="/waste" label="İsraf" />
            <NavTab to="/stats" label="İstatistik" />
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        <aside className="w-56 shrink-0">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Konum
            </h2>
            <ul className="space-y-1">
              {locations.map((loc) => {
                const Icon = locationIcons[loc.name] || Archive;
                return (
                  <li key={loc.id}>
                    <NavLink
                      to={`/inventory?location=${loc.id}`}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                          isActive
                            ? "bg-slate-100 text-slate-900 font-medium"
                            : "text-slate-700 hover:bg-slate-50"
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 text-slate-600" strokeWidth={1.75} />
                      <span>{loc.name}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <main className="flex-1 bg-white rounded-lg border border-slate-200 p-6 min-h-[600px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavTab({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-2 rounded-md text-sm font-medium transition ${
          isActive
            ? "bg-emerald-100 text-emerald-700"
            : "text-slate-600 hover:bg-slate-100"
        }`
      }
    >
      {label}
    </NavLink>
  );
}