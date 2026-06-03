import { Outlet, NavLink, Link, useLoaderData, Form } from "react-router";
import { useState } from "react";
import { Refrigerator, Snowflake, Archive, DoorClosed, ChevronDown, LogOut } from "lucide-react";
import { prisma } from "~/db.server";
import { requireUserId, getUser } from "~/auth_server";

export async function loader({ request }) {
  const userId = await requireUserId(request);

  const [locations, totalItems, user] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: "asc" } }),
    prisma.item.count({ where: { consumedAt: null, userId } }),
    getUser(request),
  ]);

  return { locations, totalItems, user };
}

const locationIcons = {
  "Buzdolabı": Refrigerator,
  "Dondurucu": Snowflake,
  "Kiler": Archive,
  "Dolap": DoorClosed,
};

export default function Layout() {
  const { locations, totalItems, user } = useLoaderData();
    const [locationsOpen, setLocationsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-lime-400">
      <header className="bg-white border-b border-slate-200 shadow-soft sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="group flex items-center gap-2.5">
  <img
    src="/logo.png"
    alt="Mutfak Yöneticisi"
    className="w-9 h-9 object-contain"
  />
  <h1 className="text-xl font-bold tracking-tight text-slate-800 group-hover:text-emerald-700 transition">
    Mutfak Yöneticisi
  </h1>
</Link>

        <div className="flex items-center gap-4">
  <nav className="flex gap-1">
    <NavTab to="/inventory" label="Envanter" />
    <NavTab to="/kitchen" label="Mutfak" />
    <NavTab to="/shopping" label="Alışveriş" />
    <NavTab to="/history" label="Geçmiş" />
    <NavTab to="/waste" label="Zarar" />
    <NavTab to="/stats" label="İstatistik" />
  </nav>

  {user && (
    <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
      <span className="text-sm text-slate-600">{user.email}</span>
      <Form method="post" action="/logout">
        <button
          type="submit"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
          title="Çıkış yap"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </Form>
    </div>
  )}
</div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
       <aside className="w-56 shrink-0">
  <div className="bg-white rounded-lg border border-slate-200 p-4">
    <button
      onClick={() => setLocationsOpen((prev) => !prev)}
      className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 hover:text-slate-700 transition"
    >
      <span>Göz At</span>
      <ChevronDown
        className={`w-4 h-4 transition-transform ${locationsOpen ? "" : "-rotate-90"}`}
        strokeWidth={2}
      />
    </button>

    {locationsOpen && (
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
    )}
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