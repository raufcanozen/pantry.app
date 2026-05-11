import { useSearchParams } from "react-router";

export function meta() {
  return [{ title: "Envanter | Dolapta Ne Var?" }];
}

export default function Inventory() {
  const [searchParams] = useSearchParams();
  const locationFilter = searchParams.get("location");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Envanter</h2>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition">
          + Ürün Ekle
        </button>
      </div>

      {locationFilter && (
        <div className="mb-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
          Filtreleniyor: lokasyon ID = {locationFilter}
        </div>
      )}

      <div className="text-center py-16 text-slate-400">
        <p>Henüz ürün eklenmedi.</p>
        <p className="text-sm mt-1">"Ürün Ekle" ile başla.</p>
      </div>
    </div>
  );
}