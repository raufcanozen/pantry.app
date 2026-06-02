import { Link } from "react-router";
import { requireUserId } from "~/auth_server";

export function meta() {
  return [
    { title: "Mutfak Yöneticisi" },
    { name: "description", content: "Akıllı mutfak envanteri" },
  ];
}

export async function loader({ request }) {
  await requireUserId(request);
  return null;
}

export default function Home() {
  return (
    <div className="flex flex-col gap-3 max-w-md">
  <DashboardCard to="/inventory" title="Envanter" accent="emerald" />
  <DashboardCard to="/kitchen" title="Ne Yenebilir?" accent="amber" />
  <DashboardCard to="/shopping" title="Alışveriş Listesi" accent="slate" />
  <DashboardCard to="/history" title="Geçmiş" accent="blue" />
  <DashboardCard to="/waste" title="Maliyet Takibi" accent="rose" />
  <DashboardCard to="/stats" title="İstatistik" accent="indigo" />
</div>
  );
}

function DashboardCard({ to, title, accent }) {
  const accentClasses = {
    emerald: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
    amber: "bg-amber-50 border-amber-200 hover:border-amber-400",
    rose: "bg-rose-50 border-rose-200 hover:border-rose-400",
    blue: "bg-blue-50 border-blue-200 hover:border-blue-400",
    slate: "bg-slate-50 border-slate-200 hover:border-slate-400",
    indigo: "bg-indigo-50 border-indigo-200 hover:border-indigo-400",
  };

  return (
    <Link
      to={to}
      className={`block px-108 py-8 border rounded-lg transition font-semibold text-slate-800 ${accentClasses[accent]}`}
    >
      {title}
    </Link>
  );
}
