import { Link, useLoaderData } from "react-router";
import { requireUserId, getUser } from "~/auth_server";
import { prisma } from "~/db.server";
import {
  Package,
  Clock,
  Wallet,
  Plus,
  ChefHat,
  ShoppingCart,
  History,
  Trash2,
  BarChart3,
  ArrowRight,
} from "lucide-react";

export function meta() {
  return [
    { title: "Anasayfa | Mutfak Yöneticisi" },
    { name: "description", content: "Akıllı mutfak envanteri" },
  ];
}

export async function loader({ request }) {
  const userId = await requireUserId(request);
  const user = await getUser(request);

  const now = new Date();
  const threeDaysLater = new Date();
  threeDaysLater.setDate(now.getDate() + 3);

  const [activeItems, expiringSoon, recentActions] = await Promise.all([
    prisma.item.findMany({
      where: { consumedAt: null, userId },
      select: { quantity: true, unitPrice: true, purchasePrice: true },
    }),
    prisma.item.findMany({
      where: {
        consumedAt: null,
        userId,
        expiryDate: { gte: now, lte: threeDaysLater },
      },
      orderBy: { expiryDate: "asc" },
      take: 3,
    }),
    prisma.item.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        quantity: true,
        unit: true,
        purchasePrice: true,
        createdAt: true,
      },
    }),
  ]);

  const totalItems = activeItems.length;
  const totalValue = activeItems.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);
  const expiringCount = expiringSoon.length;

  return {
    user,
    stats: { totalItems, totalValue, expiringCount },
    expiringSoon,
    recentActions,
  };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

function formatRelative(date) {
  const diffMs = new Date() - new Date(date);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  if (diffDays < 7) return `${diffDays} gün önce`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
  return `${Math.floor(diffDays / 30)} ay önce`;
}

export default function Home() {
  const { user, stats, expiringSoon, recentActions } = useLoaderData();
  const userName = user?.email?.split("@")[0] || "";

  return (
    <div className="max-w-6xl mx-auto">
      {/* Karşılama Başlığı */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">
          {getGreeting()}{userName ? `, ${userName}` : ""}!
        </h1>
        <p className="text-slate-600">
          Mutfağında bugün neler olduğuna bakalım.
        </p>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard
          icon={Package}
          label="Toplam Ürün"
          value={stats.totalItems}
          accent="emerald"
        />
        <StatCard
          icon={Clock}
          label="Yakında Bitiyor"
          value={stats.expiringCount}
          subtitle="3 gün veya daha az"
          accent={stats.expiringCount > 0 ? "amber" : "slate"}
        />
        <StatCard
          icon={Wallet}
          label="Toplam Değer"
          value={`${stats.totalValue.toFixed(0)} TL`}
          accent="indigo"
        />
      </div>

      {/* Yaklaşan Son Kullanma Uyarısı */}
      {expiringSoon.length > 0 && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-amber-600" strokeWidth={2} />
            <h2 className="text-sm font-semibold text-amber-900">
              Bunları zamanında kullan
            </h2>
          </div>
          <ul className="space-y-2">
            {expiringSoon.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800">{item.name}</span>
                <span className="text-amber-700">
                  {Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))} gün kaldı
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ana Eylem Kartları */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Hızlı Erişim
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <ActionCard
            to="/inventory/new"
            icon={Plus}
            title="Ürün Ekle"
            accent="emerald"
            highlight
          />
          <ActionCard
            to="/inventory"
            icon={Package}
            title="Envanter"
            accent="slate"
          />
          <ActionCard
            to="/kitchen"
            icon={ChefHat}
            title="Bugün Ne Pişsin?"
            accent="amber"
          />
          <ActionCard
            to="/shopping"
            icon={ShoppingCart}
            title="Alışveriş"
            accent="blue"
          />
          <ActionCard
            to="/history"
            icon={History}
            title="Geçmiş"
            accent="indigo"
          />
          <ActionCard
            to="/stats"
            icon={BarChart3}
            title="İstatistik"
            accent="rose"
          />
        </div>
      </div>

      {/* Son İşlemler */}
      {recentActions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Son Eklenenler
          </h2>
          <div className="bg-white border border-slate-200 rounded-xl shadow-soft overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {recentActions.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.quantity} {item.unit}
                      {item.purchasePrice ? ` · ${item.purchasePrice.toFixed(2)} TL` : ""}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatRelative(item.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              to="/history"
              className="flex items-center justify-center gap-1 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 border-t border-slate-100 transition"
            >
              Tüm geçmişi gör
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtitle, accent }) {
  const accentStyles = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    indigo: "bg-indigo-50 text-indigo-700",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-soft hover-lift">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${accentStyles[accent]}`}>
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      {subtitle && (
        <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>
      )}
    </div>
  );
}

function ActionCard({ to, icon: Icon, title, accent, highlight }) {
  const accentStyles = {
    emerald: "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100",
    slate: "bg-slate-100 text-slate-700 group-hover:bg-slate-200",
    amber: "bg-amber-50 text-amber-700 group-hover:bg-amber-100",
    blue: "bg-blue-50 text-blue-700 group-hover:bg-blue-100",
    indigo: "bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100",
    rose: "bg-rose-50 text-rose-700 group-hover:bg-rose-100",
  };

  const baseClasses = highlight
    ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600"
    : "bg-white text-slate-800 border-slate-200 hover:border-slate-300";

  return (
    <Link
      to={to}
      className={`group flex items-center gap-3 p-4 border rounded-xl transition-all hover-lift ${baseClasses}`}
    >
      <div
        className={`inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
          highlight ? "bg-emerald-500 text-white" : accentStyles[accent]
        }`}
      >
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <span className="font-medium">{title}</span>
    </Link>
  );
}