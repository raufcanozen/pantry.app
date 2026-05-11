import { Link } from "react-router";

export function meta() {
  return [
    { title: "Dolapta Ne Var?" },
    { name: "description", content: "Akıllı mutfak envanteri" },
  ];
}

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Hoş geldin
        </h2>
        <p className="text-slate-600">
          Mutfağındaki ürünleri takip et, israf etme, akıllı alışveriş yap.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DashboardCard
          to="/inventory"
          title="Envanter"
          description="Ürünlerini gör ve yönet"
          accent="emerald"
        />
        <DashboardCard
          to="/kitchen"
          title="Bugün Ne Pişsin?"
          description="Eldekiyle ne yapabilirsin"
          accent="amber"
        />
        <DashboardCard
          to="/waste"
          title="İsraf Takibi"
          description="Nereye gidiyor para?"
          accent="rose"
        />
        <DashboardCard
          to="/stats"
          title="İstatistik"
          description="Tüketim alışkanlıkların"
          accent="blue"
        />
      </div>
    </div>
  );
}

function DashboardCard({ to, title, description, accent }) {
  const accentClasses = {
    emerald: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
    amber: "bg-amber-50 border-amber-200 hover:border-amber-400",
    rose: "bg-rose-50 border-rose-200 hover:border-rose-400",
    blue: "bg-blue-50 border-blue-200 hover:border-blue-400",
  };

  return (
    <Link
      to={to}
      className={`block p-6 border rounded-lg transition ${accentClasses[accent]}`}
    >
      <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </Link>
  );
}