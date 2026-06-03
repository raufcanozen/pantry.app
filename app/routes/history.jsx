import { useLoaderData, Link, useSearchParams } from "react-router";
import { requireUserId } from "~/auth_server";
import { prisma } from "~/db.server";

export function meta() {
  return [{ title: "Geçmiş | Mutfak Yöneticisi" }];
}

export async function loader({ request }) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "added";
  const range = url.searchParams.get("range") || "30d";

  const now = new Date();
  let since = new Date();

  if (range === "today") {
    since.setHours(0, 0, 0, 0);
  } else if (range === "7d") {
    since.setDate(now.getDate() - 7);
    since.setHours(0, 0, 0, 0);
  } else {
    since.setDate(now.getDate() - 30);
    since.setHours(0, 0, 0, 0);
  }

  let entries = [];

  if (type === "added") {
    const items = await prisma.item.findMany({
      where: { createdAt: { gte: since }, userId,},
      include: { location: true },
      orderBy: { createdAt: "desc" },
    });

    entries = items.map((item) => ({
  id: item.id,
  name: item.name,
  quantity: item.purchaseQuantity ?? item.quantity,
  unit: item.unit,
  location: item.location.name,
  cost: item.purchasePrice,
  date: item.createdAt,
      }));
    } 
      else {
    const logs = await prisma.wasteLog.findMany({
      where: { loggedAt: { gte: since }, userId,},
      include: {
        item: {
          include: { location: true },
        },
      },
      orderBy: { loggedAt: "desc" },
    });

    entries = logs.map((log) => ({
      id: log.id,
      name: log.item.name,
      quantity: log.quantity,
      unit: log.item.unit,
      location: log.item.location.name,
      cost: log.estimatedCost,
      date: log.loggedAt,
    }));
  }

  const totalCost = entries.reduce((sum, e) => sum + (e.cost || 0), 0);

  return {
    entries,
    totalCost,
    currentType: type,
    currentRange: range,
  };
}

function formatDate(date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
  }).format(new Date(date));
}

function formatRelative(date) {
  const diffMs = new Date() - new Date(date);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  return `${diffDays} gün önce`;
}

export default function History() {
  const { entries, totalCost, currentType, currentRange } = useLoaderData();
  const [searchParams] = useSearchParams();

  function buildUrl(params) {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    const qs = newParams.toString();
    return qs ? `/history?${qs}` : "/history";
  }

  const rangeLabel = {
    today: "bugün",
    "7d": "son 7 gün",
    "30d": "son 30 gün",
  }[currentRange];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Son İşlemler</h2>
        <p className="text-sm text-slate-500">
          {rangeLabel} içinde yaptığın işlemler
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div className="inline-flex bg-slate-100 rounded-md p-1">
          <FilterTab
            to={buildUrl({ type: "added" })}
            active={currentType === "added"}
            label="Alınanlar"
          />
          <FilterTab
            to={buildUrl({ type: "wasted" })}
            active={currentType === "wasted"}
            label="Atılanlar"
          />
        </div>

        <div className="flex items-center gap-2">
          <FilterChip
            to={buildUrl({ range: "today" })}
            active={currentRange === "today"}
            label="Bugün"
          />
          <FilterChip
            to={buildUrl({ range: "7d" })}
            active={currentRange === "7d"}
            label="7 gün"
          />
          <FilterChip
            to={buildUrl({ range: "30d" })}
            active={currentRange === "30d"}
            label="30 gün"
          />
        </div>
      </div>

      {entries.length > 0 && (
        <div className="mb-4 px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm">
          <span className="text-slate-600">
            Toplam: <span className="font-semibold text-slate-900">{entries.length} kayıt</span>
          </span>
          {totalCost > 0 && (
            <span className="ml-4 text-slate-600">
              Değer: <span className={`font-semibold ${currentType === "wasted" ? "text-rose-700" : "text-emerald-700"}`}>
                {totalCost.toFixed(2)} TL
              </span>
            </span>
          )}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500">
            {rangeLabel} içinde {currentType === "added" ? "alınan" : "atılan"} ürün yok.
          </p>
        </div>
      ) : (
        <ul className="border border-slate-200 rounded-md divide-y divide-slate-200">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 truncate">
                  {entry.name}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {entry.quantity} {entry.unit} · {entry.location}
                </div>
              </div>

              <div className={`text-sm font-medium w-24 text-right ${
                currentType === "wasted" ? "text-rose-700" : "text-emerald-700"
              }`}>
                {entry.cost !== null ? `${entry.cost.toFixed(2)} TL` : "—"}
              </div>

              <div className="text-xs text-slate-500 w-20 text-right">
                {formatDate(entry.date)}
              </div>

              <div className="text-xs text-slate-400 w-20 text-right">
                {formatRelative(entry.date)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterTab({ to, active, label }) {
  return (
    <Link
      to={to}
      className={`px-4 py-1.5 rounded text-sm font-medium transition ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-600 hover:text-slate-800"
      }`}
    >
      {label}
    </Link>
  );
}

function FilterChip({ to, active, label }) {
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-md text-sm font-medium border transition ${
        active
          ? "bg-slate-800 text-white border-slate-800"
          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
      }`}
    >
      {label}
    </Link>
  );
}