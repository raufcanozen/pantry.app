import { useLoaderData } from "react-router";
import { requireUserId } from "~/auth_server";
import { prisma } from "~/db.server";

export function meta() {
  return [{ title: "Zarar | Mutfak Yöneticisi" }];
}

const REASON_LABELS = {
  belirtilmedi: "Belirtilmedi",
  bozuldu: "Bozuldu",
  skt_gecti: "SKT geçti",
  unuttum: "Unuttum",
  cok_aldim: "Çok aldım",
  baska: "Başka",
};

export async function loader({ request }) {
  const userId = await requireUserId(request);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const logs = await prisma.wasteLog.findMany({
    where: { userId },
    include: {
      item: {
        include: { category: true, location: true },
      },
    },
    orderBy: { loggedAt: "desc" },
  });

  const recentItems = await prisma.item.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
      userId,
    },
  });
  
  const weeklyAddedCost = recentItems.reduce((sum, item) => {
  return sum + (item.purchasePrice || 0);
  }, 0);

  // Son 7 günde atılan ürünlerin maliyeti
  const weeklyWasteLogs = logs.filter(
    (log) => new Date(log.loggedAt) >= sevenDaysAgo
  );

  const weeklyWastedCost = weeklyWasteLogs.reduce(
    (sum, log) => sum + (log.estimatedCost || 0),
    0
  );

  const weeklyTotalCost = weeklyAddedCost + weeklyWastedCost;

  // Ay bazında gruplama
  const byMonth = {};
  for (const log of logs) {
    const date = new Date(log.loggedAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth[monthKey]) byMonth[monthKey] = [];
    byMonth[monthKey].push(log);
  }

  return {
    logs,
    byMonth,
    weekly: {
      addedCost: weeklyAddedCost,
      wastedCost: weeklyWastedCost,
      totalCost: weeklyTotalCost,
      addedCount: recentItems.length,
      wastedCount: weeklyWasteLogs.length,
    },
  };
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatRelativeDate(date) {
  const diffMs = new Date() - new Date(date);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  if (diffDays < 7) return `${diffDays} gün önce`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} ay önce`;
  return `${Math.floor(diffDays / 365)} yıl önce`;
}

export default function Waste() {
  const { logs, byMonth, weekly } = useLoaderData();
  const monthKeys = Object.keys(byMonth).sort().reverse();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Zarar Takibi</h2>
        <p className="text-sm text-slate-500">
          Son 7 günün mutfak ekonomisi
        </p>
      </div>

      {/* Haftalık özet kartları */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <CostCard
          label="Eklenen Ürünler"
          value={weekly.addedCost}
          accent="emerald"
        />
        <CostCard
          label="Atılan Ürünler"
          value={weekly.wastedCost}
          accent="rose"
        />
        <CostCard
          label="Haftalık Toplam"
          value={weekly.totalCost}
          accent="slate"
          bold
        />
      </div>

      
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-3">
          Zarar Geçmişi
        </h3>

        {logs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p>Henüz zarar kaydı yok.</p>
            <p className="text-sm mt-1">
              Bir ürünü atmak zorunda kaldığında envanterden "Attım" diyebilirsin.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {monthKeys.map((monthKey) => (
              <section key={monthKey}>
                <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
                  {formatMonthLabel(monthKey)}
                </h4>
                <ul className="divide-y divide-slate-200 border border-slate-200 rounded-md">
                  {byMonth[monthKey].map((log) => (
                    <li
                      key={log.id}
                      className="flex items-center gap-4 px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 truncate">
                          {log.item.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {log.quantity} {log.item.unit}
                          {log.reason !== "belirtilmedi" &&
                            ` · ${REASON_LABELS[log.reason] || log.reason}`}
                        </div>
                      </div>

                      <div className="text-sm text-rose-700 font-medium w-24 text-right">
                        {log.estimatedCost
                          ? `${log.estimatedCost.toFixed(2)} TL`
                          : "—"}
                      </div>

                      <div className="text-xs text-slate-400 w-24 text-right">
                        {formatRelativeDate(log.loggedAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CostCard({ label, value, detail, accent, bold }) {
  const accentStyles = {
    emerald: "border-emerald-200 bg-emerald-50",
    rose: "border-rose-200 bg-rose-50",
    slate: "border-slate-300 bg-slate-100",
  };

  return (
    <div className={`p-4 rounded-lg border ${accentStyles[accent]}`}>
      <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">
        {label}
      </div>
      <div
        className={`text-2xl mt-1 ${bold ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}
      >
        {value.toFixed(2)} TL
      </div>
      <div className="text-xs text-slate-500 mt-1">{detail}</div>
    </div>
  );
}