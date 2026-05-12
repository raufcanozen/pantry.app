import { useLoaderData, useSearchParams, Link } from "react-router";
import { prisma } from "~/db.server";
import { expiryStatus, formatExpiry } from "~/utils/date.js";

export function meta() {
  return [{ title: "Envanter | Dolapta Ne Var?" }];
}

export async function loader({ request }) {
  const url = new URL(request.url);
  const locationId = url.searchParams.get("location");
  const sort = url.searchParams.get("sort") || "expiry";

  const where = {
    consumedAt: null,
    ...(locationId ? { locationId } : {}),
  };

  const orderBy =
    sort === "name"
      ? { name: "asc" }
      : sort === "added"
      ? { createdAt: "desc" }
      : { expiryDate: "asc" };

  const items = await prisma.item.findMany({
    where,
    orderBy,
    include: {
      location: true,
      category: true,
    },
  });

  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });

  return { items, locations, currentLocation: locationId, currentSort: sort };
}

const statusStyles = {
  expired: "border-l-red-700 bg-red-50",
  critical: "border-l-red-500 bg-red-50",
  safe: "border-l-emerald-500 bg-white",
  none: "border-l-slate-300 bg-white",
};

const statusTextStyles = {
  expired: "text-red-700 font-semibold",
  critical: "text-red-600 font-medium",
  safe: "text-slate-600",
  none: "text-slate-400",
};

export default function Inventory() {
  const { items, locations, currentLocation, currentSort } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();

  function setSort(value) {
    const params = new URLSearchParams(searchParams);
    params.set("sort", value);
    setSearchParams(params);
  }

  function clearLocationFilter() {
    const params = new URLSearchParams(searchParams);
    params.delete("location");
    setSearchParams(params);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Envanter</h2>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition">
          + Ürün Ekle
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <FilterChip
            label="Tümü"
            active={!currentLocation}
            onClick={clearLocationFilter}
          />
          {locations.map((loc) => (
            <FilterChip
              key={loc.id}
              label={loc.name}
              active={currentLocation === loc.id}
              to={`/inventory?location=${loc.id}${
                currentSort !== "expiry" ? `&sort=${currentSort}` : ""
              }`}
            />
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-slate-500">Sırala:</span>
          <select
            value={currentSort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:border-emerald-500"
          >
            <option value="expiry">Son Kullanma</option>
            <option value="name">İsme Göre</option>
            <option value="added">Yeni Eklenen</option>
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p>
            {currentLocation
              ? "Bu lokasyonda ürün yok."
              : "Henüz ürün eklenmedi."}
          </p>
          <p className="text-sm mt-1">"Ürün Ekle" ile başla.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const status = expiryStatus(item.expiryDate);
            return (
              <li
                key={item.id}
                className={`flex items-center gap-4 px-4 py-3 border border-slate-200 border-l-4 rounded-md ${statusStyles[status]}`}
              >
                <div className="flex-1">
                  <div className="font-medium text-slate-800">{item.name}</div>
                  {item.category && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.category.name}
                    </div>
                  )}
                </div>

                <div className="text-sm text-slate-600 w-20 text-right">
                  {item.quantity} {item.unit}
                </div>

                <div className="text-sm text-slate-600 w-24">
                  {item.location.name}
                </div>

                <div className={`text-sm w-24 text-right ${statusTextStyles[status]}`}>
                  {formatExpiry(item.expiryDate)}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 text-sm text-slate-500">
        Toplam {items.length} ürün listeleniyor
      </div>
    </div>
  );
}

function FilterChip({ label, active, to, onClick }) {
  const className = `px-3 py-1.5 rounded-full text-sm transition ${
    active
      ? "bg-slate-800 text-white"
      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
  }`;

  if (to) {
    return (
      <Link to={to} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {label}
    </button>
  );
}
