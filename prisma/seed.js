import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const locations = [
  { name: "Buzdolabı", icon: "B" },
  { name: "Dondurucu", icon: "D" },
  { name: "Kiler", icon: "K" },
  { name: "Dolap", icon: "Dl" },
];

  const categories = [
    "Süt Ürünleri",
    "Et & Tavuk",
    "Sebze",
    "Meyve",
    "Kuru Gıda",
    "Baharat",
    "İçecek",
    "Diğer",
  ];

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { name: loc.name },
      update: {},
      create: loc,
    });
  }

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat },
      update: {},
      create: { name: cat },
    });
  }

  console.log("✓ Seed data başarıyla oluşturuldu");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
