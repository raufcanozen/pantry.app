import { useLoaderData } from "react-router";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { prisma } from "~/db.server";

export function meta() {
  return [{ title: "İstatistik | Mutfak Yöneticisi" }];
}

export async function loader() {
  // Son 6 ayın verisi
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  // Tüm eklenen ürünler (son 6 ay)
  const recentItems = await prisma.item.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: {
      createdAt: true,
      quantity: true,
      unitPrice: true,
      consumedAt: true,
    },
  });

  // Tüm zarar kayıtları (son 6 ay)
  const recentWaste = await prisma.wasteLog.findMany({
    where: { loggedAt: { gte: sixMonthsAgo } },
    include: {
      item: { select: { name: true } },
    },
    orderBy: { loggedAt: "desc" },
  });

  // Ay bazında gruplama
  const monthlyData = {};
  const formatMonthKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  const formatMonthLabel = (key) => {
    const [y, m] = key.split("-");
    return new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(
      new Date(Number(y), Number(m) - 1, 1)
    );
  };

  // Son 6 ayın anahtarlarını oluştur
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = formatMonthKey(d);
    monthlyData[key] = {
      month: formatMonthLabel(key),
      Eklenen: 0,
      Atılan: 0,
    };
  }

  // Eklenenleri ay bazında topla
  for (const item of recentItems) {
    const key = formatMonthKey(new Date(item.createdAt));
    if (monthlyData[key]) {
      const cost = item.unitPrice ? item.quantity * item.unitPrice : 0;
      monthlyData[key].Eklenen += cost;
    }
  }

  // Atılanları ay bazında topla
  for (const log of recentWaste) {
    const key = formatMonthKey(new Date(log.loggedAt));
    if (monthlyData[key]) {
      monthlyData[key].Atılan += log.estimatedCost || 0;
    }
  }

  // Round
  const chartData = Object.values(monthlyData).map((m) => ({
    month: m.month,
    Eklenen: Math.round(m.Eklenen),
    Atılan: Math.round(m.Atılan),
  }));

  // En çok atılan ürünler (top 5)
  const wasteByName = {};
  for (const log of recentWaste) {
    const name = log.item.name;
    if (!wasteByName[name]) {
      wasteByName[name] = { name, count: 0, totalCost: 0 };
    }
    wasteByName[name].count += 1;
    wasteByName[name].totalCost += log.estimatedCost || 0;
  }
  const topWasted = Object.values(wasteByName)
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 5);

  // Lokasyon bazında aktif stok
  const activeItems = await prisma.item.findMany({
    where: { consumedAt: null },
    include: { location: true },
  });

  const stockByLocation = {};
  for (const item of activeItems) {
    const locName = item.location.name;
    if (!stockByLocation[locName]) {
      stockByLocation[locName] = { count: 0, value: 0 };
    }
    stockByLocation[locName].count += 1;
    stockByLocation[locName].value += item.unitPrice
      ? item.quantity * item.unitPrice
      : 0;
  }

  // Genel sayılar
  const totalAdded = chartData.reduce((sum, m) => sum + m.Eklenen, 0);
  const totalWasted = chartData.reduce((sum, m) => sum + m.Atılan, 0);
  const wasteRate = totalAdded > 0 ? (totalWasted / totalAdded) * 100 : 0;

  return {
    chartData,
    topWasted,
    stockByLocation,
    totals: {
      added: totalAdded,
      wasted: totalWasted,
      wasteRate: Math.round(wasteRate * 10) / 10,
      activeItemCount: activeItems.length,
    },
  };
}

export default function Stats() {
  const { chartData, topWasted, stockByLocation, totals } = useLoaderData();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">İstatistik</h2>
        <p className="text-sm text-slate-500">Son 6 ayın mutfak özet bilgileri</p>
      </div>

      {/* Üst özet kartları */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <SummaryCard
          label="Toplam Harcama"
          value={`${totals.added.toFixed(0)} TL`}
          accent="slate"
        />
        <SummaryCard
          label="Toplam Zarar"
          value={`${totals.wasted.toFixed(0)} TL`}
          accent="rose"
        />
        <SummaryCard
          label="Zarar Oranı"
          value={`%${totals.wasteRate}`}
          accent={totals.wasteRate > 15 ? "rose" : totals.wasteRate > 5 ? "amber" : "emerald"}
        />
        <SummaryCard
          label="Aktif Stok"
          value={`${totals.activeItemCount} ürün`}
          accent="emerald"
        />
      </div>

      {/* Bar Chart — Aylık karşılaştırma */}
      <section className="mb-8">
        <h3 className="text-base font-semibold text-slate-800 mb-3">
          Aylık Karşılaştırma
        </h3>
        <div className="border border-slate-200 rounded-lg p-4 bg-white">
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                  }}
                  formatter={(value) => `${value} TL`}
                />
                <Legend />
                <Bar dataKey="Eklenen" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Atılan" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* En çok atılanlar + Lokasyon dağılımı */}
      <div className="grid grid-cols-2 gap-6">
        <section>
          <h3 className="text-base font-semibold text-slate-800 mb-3">
            En Çok Atılan Ürünler
          </h3>
          {topWasted.length === 0 ? (
            <div className="border border-slate-200 rounded-lg p-6 text-center text-slate-400 text-sm">
              Henüz zarar kaydı yok.
            </div>
          ) : (
            <ul className="border border-slate-200 rounded-lg divide-y divide-slate-200">
              {topWasted.map((item, idx) => (
                <li
                  key={item.name}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="text-sm font-semibold text-slate-400 w-5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.count} kez atıldı
                    </div>
                  </div>
                  <div className="text-sm text-rose-700 font-medium">
                    {item.totalCost.toFixed(0)} TL
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="text-base font-semibold text-slate-800 mb-3">
            Lokasyona Göre Stok
          </h3>
          {Object.keys(stockByLocation).length === 0 ? (
            <div className="border border-slate-200 rounded-lg p-6 text-center text-slate-400 text-sm">
              Stokta ürün yok.
            </div>
          ) : (
            <ul className="border border-slate-200 rounded-lg divide-y divide-slate-200">
              {Object.entries(stockByLocation).map(([loc, stats]) => (
                <li
                  key={loc}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800">
                      {loc}
                    </div>
                    <div className="text-xs text-slate-500">
                      {stats.count} ürün
                    </div>
                  </div>
                  <div className="text-sm text-emerald-700 font-medium">
                    {stats.value.toFixed(0)} TL
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, accent }) {
  const accentStyles = {
    slate: "border-slate-200 bg-slate-50",
    rose: "border-rose-200 bg-rose-50",
    emerald: "border-emerald-200 bg-emerald-50",
    amber: "border-amber-200 bg-amber-50",
  };
  return (
    <div className={`p-4 rounded-lg border ${accentStyles[accent]}`}>
      <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
    </div>
  );
}