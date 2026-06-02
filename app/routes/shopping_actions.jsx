import { requireUserId } from "~/auth_server";
import { prisma } from "~/db.server";

export async function action({ request }) {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "add_missing") {
    const itemsJson = formData.get("items");
    if (!itemsJson) return { error: "Eksik malzeme yok" };

    const names = JSON.parse(itemsJson);

    const existing = await prisma.shoppingListItem.findMany({
      where: {
        name: { in: names },
        isPurchased: false,
        userId,
      },
      select: { name: true },
    });

    const existingNames = new Set(existing.map((e) => e.name));
    const toAdd = names.filter((n) => !existingNames.has(n));

    if (toAdd.length === 0) {
      return { success: true, added: 0, message: "Hepsi listede zaten" };
    }

    await prisma.shoppingListItem.createMany({
      data: toAdd.map((name) => ({
        name,
        isAutoAdded: true,
        userId,
      })),
    });

    return { success: true, added: toAdd.length };
  }

  if (intent === "add_manual") {
    const name = formData.get("name")?.toString().trim();
    if (!name) return { error: "Ürün adı zorunlu" };

    const existing = await prisma.shoppingListItem.findFirst({
      where: { name, isPurchased: false, userId },
    });

    if (existing) {
      return { success: true, message: "Listede zaten var" };
    }

    await prisma.shoppingListItem.create({
      data: { name, isAutoAdded: false, userId },
    });

    return { success: true };
  }

  if (intent === "toggle_purchased") {
    const id = formData.get("id");
    if (!id) return { error: "ID zorunlu" };

    const item = await prisma.shoppingListItem.findFirst({
      where: { id, userId },
    });
    if (!item) return { error: "Ürün bulunamadı" };

    await prisma.shoppingListItem.update({
      where: { id },
      data: { isPurchased: !item.isPurchased },
    });

    return { success: true };
  }

  if (intent === "delete") {
    const id = formData.get("id");
    if (!id) return { error: "ID zorunlu" };

    const item = await prisma.shoppingListItem.findFirst({
      where: { id, userId },
    });
    if (!item) return { error: "Ürün bulunamadı" };

    await prisma.shoppingListItem.delete({ where: { id } });

    return { success: true };
  }

  return { error: "Geçersiz işlem" };
}

export async function loader() {
  return new Response(null, { status: 404 });
}