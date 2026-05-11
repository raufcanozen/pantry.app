export function meta() {
  return [{ title: "Mutfak | Dolapta Ne Var?" }];
}

export default function Kitchen() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        Bugün Ne Pişsin?
      </h2>
      <div className="text-center py-16 text-slate-400">
        <p>Yakında: Elindeki malzemelerle yapabileceğin tarifler.</p>
      </div>
    </div>
  );
}