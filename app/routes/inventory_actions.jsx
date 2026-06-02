import { redirect } from "react-router";
import { requireUserId } from "~/auth_server";
import { prisma } from "~/db.server";

export async function action({ request }) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const itemId = formData.get("itemId");

  if (!itemId) {
    return { error: "Ürün ID gerekli" };
  }

  // Ownership doğrulaması
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
  });

  if (!item) {
    return { error: "Ürün bulunamadı" };
  }

  if (intent === "consume") {
    await prisma.item.update({
      where: { id: itemId },
      data: { consumedAt: new Date() },
    });
    return { success: true };
  }

  if (intent === "delete") {
    await prisma.item.delete({
      where: { id: itemId },
    });
    return { success: true };
  }

  return { error: "Geçersiz işlem" };
}
export async function loader() {
  return redirect("/inventory");
}