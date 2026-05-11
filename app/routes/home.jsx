export function meta() {
  return [
    { title: "Dolapta Ne Var?" },
    { name: "description", content: "Akıllı mutfak envanteri ve israf takip uygulaması" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <h1 className="text-4xl font-bold text-emerald-600">
        Dolapta Ne Var? 
      </h1>
    </div>
  );
}
