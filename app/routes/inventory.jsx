import { useLoaderData, useSearchParams, useFetcher, Link } from "react-router";
import { PackageOpen, Search } from "lucide-react";
import { requireUserId } from "~/auth_server";
import { prisma } from "~/db.server";
import { expiryStatus, formatExpiry } from "~/utils/date.js";

export function meta() {
  return [{ title: "Envanter | Mutfak Yöneticisi" }];
}

export async function loader({ request }) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const locationId = url.searchParams.get("location");
  const sort = url.searchParams.get("sort") || "expiry";
  const query = url.searchParams.get("q")?.trim() || "";

  const where = {
    consumedAt: null,
     userId,
    ...(locationId ? { locationId } : {}),
    ...(query
      ? {
          name: {
            contains: query,
            mode: "insensitive",
          },
        }
      : {}),
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

  return { items, locations, currentLocation: locationId, currentSort: sort, currentQuery: query };
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
  const { items, locations, currentLocation, currentSort, currentQuery } = useLoaderData();
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
      <div className="flex items-center justify-between gap-4 mb-6">
  <h2 className="text-2xl font-bold text-slate-800 shrink-0">Envanter</h2>

  <div className="relative flex-1 max-w-sm">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
    <input
      type="search"
      placeholder="Ürün ara..."
      value={currentQuery}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams);
        if (e.target.value) {
          params.set("q", e.target.value);
        } else {
          params.delete("q");
        }
        setSearchParams(params, { replace: true });
      }}
      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-emerald-500"
    />
  </div>

  <Link
    to="/inventory/new"
    className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition shrink-0"
  >
    + Ürün Ekle
  </Link>
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
  <div className="text-center py-16">
    <PackageOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" strokeWidth={1.5} />
    <p className="text-slate-500">
      {currentQuery
        ? `"${currentQuery}" için sonuç bulunamadı.`
        : currentLocation
        ? "Bu lokasyonda ürün yok."
        : "Henüz ürün eklenmedi."}
    </p>
    {!currentLocation && !currentQuery && (
      <Link
        to="/inventory/new"
        className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition"
      >
        Ürün Ekle
      </Link>
    )}
  </div>
) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}

      <div className="mt-6 text-sm text-slate-500">
        Toplam {items.length} ürün listeleniyor
      </div>
    </div>
  );
}

function ItemRow({ item }) {
  const status = expiryStatus(item.expiryDate);
  const fetcher = useFetcher();
  const isProcessing = fetcher.state !== "idle";

  function handleDelete() {
    if (!confirm(`"${item.name}" silinsin mi?`)) return;
    fetcher.submit(
      { intent: "delete", itemId: item.id },
      { method: "post", action: "/inventory/actions" }
    );
  }

  return (
    <li
      className={`flex items-center gap-4 px-4 py-3 border border-slate-200 border-l-4 rounded-md ${statusStyles[status]} ${
        isProcessing ? "opacity-50" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-800 truncate">{item.name}</div>
        {item.category && (
          <div className="text-xs text-slate-500 mt-0.5">
            {item.category.name}
          </div>
        )}
      </div>

      <div className="text-sm text-slate-600 w-20 text-right">
        {item.quantity} {item.unit}
      </div>
       
     <div className="w-24 text-right">
      <div className="text-sm text-slate-600">
    {item.quantity} {item.unit}
      </div>
  {item.unitPrice && (
       <div className="text-xs text-slate-500 mt-0.5">
      {(item.quantity * item.unitPrice).toFixed(2)} TL
       </div>
  )}
     </div>

      <div className="text-sm text-slate-600 w-24">{item.location.name}</div>

      <div
        className={`text-sm w-20 text-right ${statusTextStyles[status]}`}
      >
        {formatExpiry(item.expiryDate)}
      </div>

     <div className="flex items-center gap-2">
  <Link
    to={`/inventory/${item.id}/edit`}
    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:border-slate-400 transition"
  >
    Düzenle
  </Link>
  <Link
    to={`/inventory/${item.id}/consume`}
    className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-white border border-emerald-300 rounded-md hover:bg-emerald-50 hover:border-emerald-500 transition"
  >
    Kullanıldı
  </Link>
  <Link
    to={`/inventory/${item.id}/waste`}
    className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-white border border-amber-300 rounded-md hover:bg-amber-50 hover:border-amber-500 transition"
  >
    Atıldı
  </Link>
  <button
    onClick={handleDelete}
    disabled={isProcessing}
    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 hover:border-red-500 disabled:opacity-50 transition"
  >
    Sil
  </button>
</div>
    </li>
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
