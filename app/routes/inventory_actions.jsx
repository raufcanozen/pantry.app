import { redirect } from "react-router";
import { prisma } from "~/db.server";

export async function action({ request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const itemId = formData.get("itemId");

  if (!itemId) {
    return { error: "Ürün ID gerekli" };
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

// Resource route'lar default export'a ihtiyaç duymaz
// ama React Router şikayet etmesin diye boş bir loader ekleyebiliriz
export async function loader() {
  return redirect("/inventory");
}