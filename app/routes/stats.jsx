export function meta() {
  return [{ title: "İstatistik | Dolapta Ne Var?" }];
}

export default function Stats() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        İstatistik
      </h2>
      <div className="text-center py-16 text-slate-400">
        <p>Yakında: Aylık tüketim ve israf grafikleri.</p>
      </div>
    </div>
  );
}
