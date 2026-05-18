import { useLoaderData, useFetcher } from "react-router";
import { prisma } from "~/db.server";
import { ingredientMatches } from "~/utils/match.js";

export function meta() {
  return [{ title: "Bugün Ne Pişsin? | Dolapta Ne Var?" }];
}

export async function loader() {
  // Envanterdeki aktif ürünler (tüketilmemiş)
  const items = await prisma.item.findMany({
    where: { consumedAt: null },
    select: { name: true },
  });

  // Tüm yemekler ve malzemeleri
  const dishes = await prisma.dish.findMany({
    include: { ingredients: true },
    orderBy: { name: "asc" },
  });

  // Her yemek için eşleşme hesapla
  const enriched = dishes.map((dish) => {
    const available = [];
    const missing = [];

    for (const ing of dish.ingredients) {
      const hasIt = items.some((item) => ingredientMatches(item.name, ing.name));
      if (hasIt) {
        available.push(ing.name);
      } else {
        missing.push(ing.name);
      }
    }

    const total = dish.ingredients.length;
    const matchPercent = total === 0 ? 0 : Math.round((available.length / total) * 100);

    return {
      id: dish.id,
      name: dish.name,
      available,
      missing,
      total,
      matchPercent,
    };
  });

  // %50 ve üzeri eşleşenleri filtrele, eşleşme yüzdesine göre sırala
  const filtered = enriched
    .filter((d) => d.matchPercent >= 50)
    .sort((a, b) => b.matchPercent - a.matchPercent);

  return {
    dishes: filtered,
    inventoryCount: items.length,
    totalDishes: dishes.length,
  };
}

export default function Kitchen() {
  const { dishes, inventoryCount, totalDishes } = useLoaderData();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">
          Bugün Ne Pişsin?
        </h2>
        <p className="text-sm text-slate-500">
          Envanterindeki {inventoryCount} ürünle yapabileceğin yemekler
        </p>
      </div>

      {dishes.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p>Şu an yapabileceğin bir yemek görünmüyor.</p>
          <p className="text-sm mt-1">
            Envantere malzeme ekledikçe öneriler burada belirir.
          </p>
        </div>
      ) : (
        <>
          <div className="text-sm text-slate-500 mb-4">
            {totalDishes} yemekten {dishes.length} tanesi en az %50 eşleşiyor.
          </div>
          <ul className="space-y-3">
            {dishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function DishCard({ dish }) {
  const fetcher = useFetcher();
  const isAdding = fetcher.state !== "idle";

  function addMissingToShoppingList() {
    if (dish.missing.length === 0) return;
    fetcher.submit(
      { intent: "add_missing", items: JSON.stringify(dish.missing) },
      { method: "post", action: "/shopping/actions" }
    );
  }

  const matchColor =
    dish.matchPercent === 100
      ? "text-emerald-700 bg-emerald-100"
      : dish.matchPercent >= 75
      ? "text-emerald-700 bg-emerald-50"
      : "text-amber-700 bg-amber-50";

  return (
    <li className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-800">{dish.name}</h3>
        <div className={`px-2 py-1 rounded text-xs font-medium ${matchColor}`}>
          %{dish.matchPercent} eşleşme
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">
            Eldekiler ({dish.available.length})
          </div>
          <ul className="space-y-0.5">
            {dish.available.map((ing) => (
              <li key={ing} className="text-slate-700">
                {ing}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs font-medium text-rose-700 uppercase tracking-wide mb-1">
            Eksikler ({dish.missing.length})
          </div>
          {dish.missing.length === 0 ? (
            <p className="text-slate-500 italic">Hepsi sende</p>
          ) : (
            <>
              <ul className="space-y-0.5 mb-2">
                {dish.missing.map((ing) => (
                  <li key={ing} className="text-slate-700">
                    {ing}
                  </li>
                ))}
              </ul>
              <button
                onClick={addMissingToShoppingList}
                disabled={isAdding}
                className="text-xs px-2 py-1 bg-slate-800 text-white rounded hover:bg-slate-900 disabled:opacity-50 transition"
              >
                {isAdding ? "Ekleniyor..." : "Alışveriş listesine ekle"}
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}