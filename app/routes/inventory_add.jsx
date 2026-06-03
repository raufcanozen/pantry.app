import { Form, Link, useActionData, useLoaderData, useNavigation, redirect } from "react-router";
import { requireUserId } from "~/auth_server";
import { z } from "zod";
import { prisma } from "~/db.server";

export function meta() {
  return [{ title: "Yeni Ürün | Mutfak Yöneticisi" }];
}

export async function loader({request}) {
  await requireUserId(request);
  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });
  return { locations };
}

const ItemSchema = z.object({
  name: z.string().trim().min(1, "Ürün adı zorunlu").max(100, "Ürün adı çok uzun"),
  quantity: z.coerce.number().positive("Miktar pozitif olmalı"),
  unit: z.string().trim().min(1, "Birim zorunlu"),
  unitPrice: z.coerce.number().positive("Birim fiyat pozitif olmalı"),
  locationId: z.string().min(1, "Saklama yeri seçin"),
  expiryDate: z.string().min(1, "Son kullanma tarihi zorunlu"),
});

export async function action({ request }) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const raw = Object.fromEntries(formData);

  const result = ItemSchema.safeParse(raw);

  if (!result.success) {
    const fieldErrors = {};
    for (const issue of result.error.issues) {
      fieldErrors[issue.path[0]] = issue.message;
    }
    return { errors: fieldErrors, values: raw };
  }

  const data = result.data;

 await prisma.item.create({
  data: {
    name: data.name,
    quantity: data.quantity,
    unit: data.unit,
    unitPrice: data.unitPrice,
    purchasePrice: data.quantity * data.unitPrice,
    purchaseQuantity: data.quantity,
    locationId: data.locationId,
    expiryDate: new Date(data.expiryDate),
    userId,
  },
});

  return redirect("/inventory");
}

export default function NewItem() {
  const { locations } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const errors = actionData?.errors || {};
  const values = actionData?.values || {};

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Yeni Ürün Ekle</h2>
        <Link
          to="/inventory"
          className="text-slate-500 hover:text-slate-800 text-2xl leading-none"
        >
          ×
        </Link>
      </div>

      <Form method="post" className="space-y-4">
        <Field label="Ürün Adı" error={errors.name}>
          <input
            type="text"
            name="name"
            defaultValue={values.name || ""}
            autoFocus
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-emerald-500"
            placeholder="örn: Domates"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Miktar" error={errors.quantity}>
            <input
              type="number"
              name="quantity"
              step="0.5"
              min="0"
              defaultValue={values.quantity || "1"}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-emerald-500"
            />
          </Field>

          <Field label="Birim" error={errors.unit}>
            <select
              name="unit"
              defaultValue={values.unit || "adet"}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:border-emerald-500"
            >
              <option value="adet">adet</option>
              <option value="g">gram</option>
              <option value="kg">kilogram</option>
              <option value="ml">mililitre</option>
              <option value="L">litre</option>
              <option value="paket">paket</option>
              <option value="kutu">kutu</option>
              <option value="şişe">şişe</option>
            </select>
          </Field>
        </div>

        <Field label="Birim Fiyat (TL)" error={errors.unitPrice}>
          <input
            type="number"
            name="unitPrice"
            step="0.01"
            min="0"
            defaultValue={values.unitPrice || ""}
            placeholder="örn: 25"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-emerald-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            Toplam maliyet otomatik hesaplanacak (miktar × birim fiyat).
          </p>
        </Field>

        <Field label="Saklama Yeri" error={errors.locationId}>
          <select
            name="locationId"
            defaultValue={values.locationId || ""}
            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">Seçin...</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Son Kullanma Tarihi" error={errors.expiryDate}>
          <input
            type="date"
            name="expiryDate"
            required
            defaultValue={values.expiryDate || ""}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-emerald-500"
          />
        </Field>

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
            className="px-5 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </Form>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}