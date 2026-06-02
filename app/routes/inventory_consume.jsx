import { Form, Link, useActionData, useLoaderData, useNavigation, redirect } from "react-router";
import { requireUserId } from "~/auth_server";
import { z } from "zod";
import { prisma } from "~/db.server";

export function meta({ data }) {
  return [{ title: `${data?.item?.name || "Ürün"} kullanıldı | Mutfak Yöneticisi` }];
}

export async function loader({ request, params }) {
  const userId = await requireUserId(request);

  const item = await prisma.item.findFirst({
    where: { id: params.itemId, userId },
    include: { location: true },
  });

  if (!item) {
    throw new Response("Ürün bulunamadı", { status: 404 });
  }

  return { item };
}

export async function action({ request, params }) {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const raw = Object.fromEntries(formData);

  const ConsumeSchema = z.object({
    consumedQuantity: z.coerce.number().positive("Kullanılan miktar pozitif olmalı"),
  });

  const result = ConsumeSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors = {};
    for (const issue of result.error.issues) {
      fieldErrors[issue.path[0]] = issue.message;
    }
    return { errors: fieldErrors, values: raw };
  }

  const item = await prisma.item.findFirst({
    where: { id: params.itemId, userId },
  });

  if (!item) {
    throw new Response("Ürün bulunamadı", { status: 404 });
  }

  const { consumedQuantity } = result.data;

  if (consumedQuantity > item.quantity) {
    return {
      errors: { consumedQuantity: `En fazla ${item.quantity} ${item.unit} kullanabilirsin` },
      values: raw,
    };
  }

  const isFullyConsumed = consumedQuantity >= item.quantity;

  if (isFullyConsumed) {
    await prisma.item.update({
      where: { id: item.id },
      data: { consumedAt: new Date() },
    });
  } else {
    await prisma.item.update({
      where: { id: item.id },
      data: { quantity: item.quantity - consumedQuantity },
    });
  }

  return redirect("/inventory");
}

export default function ConsumeItem() {
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
          <h2 className="text-2xl font-bold text-slate-800">Kullanıldı</h2>
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
            Ne kadarı kullanıldı? ({item.unit})
          </label>
          <input
            type="number"
            name="consumedQuantity"
            step="0.5"
            min="0"
            max={item.quantity}
            required
            autoFocus
            defaultValue={values.consumedQuantity || item.quantity}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-emerald-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            En fazla {item.quantity} {item.unit}. Tümünü kullandıysan olduğu gibi bırak.
          </p>
          {errors.consumedQuantity && (
            <p className="mt-1 text-sm text-red-600">{errors.consumedQuantity}</p>
          )}
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
            className="px-5 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </Form>
    </div>
  );
}