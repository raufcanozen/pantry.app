import { Form, useLoaderData, useFetcher, useNavigation } from "react-router";
import { requireUserId } from "~/auth_server";
import { ShoppingBasket } from "lucide-react";
import { prisma } from "~/db.server";
import { getAutoSuggestions } from "~/utils/consumption.js";

export function meta() {
  return [{ title: "Alışveriş | Mutfak Yöneticisi" }];
}

export async function loader({ request }) {
  const userId = await requireUserId(request);

  const pending = await prisma.shoppingListItem.findMany({
    where: { isPurchased: false, userId },
    orderBy: { createdAt: "desc" },
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const purchased = await prisma.shoppingListItem.findMany({
    where: {
      isPurchased: true,
      createdAt: { gte: sevenDaysAgo },
      userId,
    },
    orderBy: { createdAt: "desc" },
  });

  const suggestions = await getAutoSuggestions(userId);

  return { pending, purchased, suggestions };
}

export default function Shopping() {
  const { pending, purchased, suggestions } = useLoaderData();
  const fetcher = useFetcher();
  const isAdding = fetcher.state !== "idle" && fetcher.formData?.get("intent") === "add_manual";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Alışveriş Listesi</h2>
          <p className="text-sm text-slate-500">
            {pending.length} ürün listede{suggestions.length > 0 ? `, ${suggestions.length} otomatik öneri` : ""}
          </p>
        </div>
      </div>

      {/* Manuel ekleme formu */}
      <fetcher.Form
        method="post"
        action="/shopping/actions"
        className="flex items-center gap-2 mb-8 p-3 bg-slate-50 rounded-lg border border-slate-200"
        onSubmit={(e) => {
          
          setTimeout(() => e.target.reset(), 0);
        }}
      >
        <input type="hidden" name="intent" value="add_manual" />
        <input
          type="text"
          name="name"
          required
          placeholder="Listeye eklenecek ürün..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={isAdding}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
        >
          {isAdding ? "Ekleniyor..." : "Ekle"}
        </button>
      </fetcher.Form>

      {/* Otomatik öneriler */}
      {suggestions.length > 0 && (
        <section className="mb-8">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Otomatik Öneriler
          </h3>
          <ul className="space-y-2">
            {suggestions.map((sug) => (
              <SuggestionRow key={sug.name} suggestion={sug} />
            ))}
          </ul>
        </section>
      )}

      {/* Listedekiler */}
      <section className="mb-8">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Listede
        </h3>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Liste boş.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((item) => (
              <PendingRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>

      {/* Satın alınanlar */}
      {purchased.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Son 7 Gün Alınanlar
          </h3>
          <ul className="space-y-1">
            {purchased.map((item) => (
              <PurchasedRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SuggestionRow({ suggestion }) {
  const fetcher = useFetcher();
  const isAdding = fetcher.state !== "idle";

  return (
    <li
      className={`flex items-center gap-3 px-3 py-2 border border-amber-200 bg-amber-50 rounded-md ${
        isAdding ? "opacity-50" : ""
      }`}
    >
      <div className="flex-1">
        <div className="font-medium text-slate-800 capitalize">{suggestion.name}</div>
        <div className="text-xs text-slate-500 mt-0.5">
          Son alımdan {suggestion.daysSinceLastPurchase} gün geçti
          {" · "}
          ortalama her {suggestion.avgLifespan} günde bir tüketiliyor
        </div>
      </div>
      <fetcher.Form method="post" action="/shopping/actions">
        <input type="hidden" name="intent" value="add_manual" />
        <input type="hidden" name="name" value={suggestion.name} />
        <button
          type="submit"
          disabled={isAdding}
          className="px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 rounded transition disabled:opacity-50"
        >
          {isAdding ? "Ekleniyor..." : "Listeye ekle"}
        </button>
      </fetcher.Form>
    </li>
  );
}

function PendingRow({ item }) {
  const fetcher = useFetcher();
  const isProcessing = fetcher.state !== "idle";

  return (
    <li
      className={`flex items-center gap-3 px-3 py-2 border border-slate-200 rounded-md ${
        isProcessing ? "opacity-50" : ""
      }`}
    >
      <fetcher.Form method="post" action="/shopping/actions">
        <input type="hidden" name="intent" value="toggle_purchased" />
        <input type="hidden" name="id" value={item.id} />
        <button
          type="submit"
          className="w-5 h-5 border-2 border-slate-300 rounded hover:border-emerald-500 transition"
          title="Satın alındı"
        />
      </fetcher.Form>

      <div className="flex-1">
  <span className="text-slate-800 capitalize">{item.name}</span>  
      </div>

  <fetcher.Form method="post" action="/shopping/actions">
   <input type="hidden" name="intent" value="delete" />
   <input type="hidden" name="id" value={item.id} />
      <button
          type="submit"
          className="px-3 py-1 text-xs font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 hover:border-red-500 transition"
       >
         Sil
      </button>
    </fetcher.Form>
      </li>
  );
}

function PurchasedRow({ item }) {
  const fetcher = useFetcher();

  function handleToggle() {
    fetcher.submit(
      { intent: "toggle_purchased", id: item.id },
      { method: "post", action: "/shopping/actions" }
    );
  }

  return (
    <li className="flex items-center gap-3 px-3 py-1.5 text-sm">
      <button
        onClick={handleToggle}
        className="w-4 h-4 bg-emerald-500 border-2 border-emerald-500 rounded flex items-center justify-center text-white text-xs hover:bg-emerald-600 transition"
        title="Geri al"
      >
        ✓
      </button>
      <span className="text-slate-500 line-through capitalize">{item.name}</span>
    </li>
  );
}