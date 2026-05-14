import { Form, Link, useActionData, useLoaderData, useNavigation, redirect } from "react-router";
import { z } from "zod";
import { prisma } from "~/db.server";

export function meta({ data }) {
  return [{ title: `${data?.item?.name || "Ürün"} israfı | Dolapta Ne Var?` }];
}

export async function loader({ params }) {
  const item = await prisma.item.findUnique({
    where: { id: params.itemId },
    include: { location: true },
  });

  if (!item) {
    throw new Response("Ürün bulunamadı", { status: 404 });
  }

  return { item };
}

const REASONS = [
  { value: "belirtilmedi", label: "Belirtilmedi" },
  { value: "bozuldu", label: "Bozuldu / küflendi" },
  { value: "skt_gecti", label: "Son kullanma tarihi geçti" },
  { value: "unuttum", label: "Unuttum, kullanamadım" },
  { value: "cok_aldim", label: "Çok almışım, bitmedi" },
  { value: "baska", label: "Başka" },
];

export async function action({ request, params }) {
  const formData = await request.formData();
  const raw = Object.fromEntries(formData);

  const WasteSchema = z.object({
    wastedQuantity: z.coerce.number().positive("Atılan miktar pozitif olmalı"),
    reason: z.string().default("belirtilmedi"),
  });

  const result = WasteSchema.safeParse(raw);

  if (!result.success) {
    const fieldErrors = {};
    for (const issue of result.error.issues) {
      fieldErrors[issue.path[0]] = issue.message;
    }
    return { errors: fieldErrors, values: raw };
  }

  const item = await prisma.item.findUnique({
    where: { id: params.itemId },
  });

  if (!item) {
    throw new Response("Ürün bulunamadı", { status: 404 });
  }

  const { wastedQuantity, reason } = result.data;

  if (wastedQuantity > item.quantity) {
    return {
      errors: { wastedQuantity: `En fazla ${item.quantity} ${item.unit} atabilirsin` },
      values: raw,
    };
  }

  // Maliyet otomatik hesaplanıyor
  const estimatedCost = item.unitPrice ? wastedQuantity * item.unitPrice : null;

  const isFullyWasted = wastedQuantity >= item.quantity;

  await prisma.$transaction([
    prisma.wasteLog.create({
      data: {
        itemId: item.id,
        reason: reason || "belirtilmedi",
        quantity: wastedQuantity,
        estimatedCost,
      },
    }),
    // Tamamen atıldıysa ürünü "tüketildi" işaretle, yoksa miktarı azalt
    isFullyWasted
      ? prisma.item.update({
          where: { id: item.id },
          data: { consumedAt: new Date() },
        })
      : prisma.item.update({
          where: { id: item.id },
          data: { quantity: item.quantity - wastedQuantity },
        }),
  ]);

  return redirect("/inventory");
}

export default function WasteItem() {
  const { item } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const errors = actionData?.errors || {};
  const values = actionData?.values || {};

  const totalCost = item.unitPrice ? item.quantity * item.unitPrice : null;

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">İsraf Kaydı</h2>
          <p className="text-sm text-slate-500 mt-1">
            <span className="font-medium text-slate-700">{item.name}</span>
            {" — "}
            Stokta: {item.quantity} {item.unit}
            {totalCost !== null && ` (${totalCost.toFixed(2)} TL değerinde)`}
          </p>
        </div>
        <Link
          to="/inventory"
          className="text-slate-500 hover:text-slate-800 text-2xl leading-none"
        >
          ×
        </Link>
      </div>

      <Form method="post" className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Ne kadarı atıldı? ({item.unit})
          </label>
          <input
            type="number"
            name="wastedQuantity"
            step="0.5"
            min="0"
            max={item.quantity}
            required
            defaultValue={values.wastedQuantity || item.quantity}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-red-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            En fazla {item.quantity} {item.unit}.
            {item.unitPrice && ` Birim fiyat: ${item.unitPrice.toFixed(2)} TL/${item.unit}.`}
          </p>
          {errors.wastedQuantity && (
            <p className="mt-1 text-sm text-red-600">{errors.wastedQuantity}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Sebep (opsiyonel)
          </label>
          <select
            name="reason"
            defaultValue={values.reason || "belirtilmedi"}
            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:border-red-500"
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            to="/inventory"
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md text-sm font-medium"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
          >
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </Form>
    </div>
  );
}