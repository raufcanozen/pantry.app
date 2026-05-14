import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date;
}

async function main() {
  // ===== LOCATIONS =====
  const locations = [
    { name: "Buzdolabı", icon: "B" },
    { name: "Dondurucu", icon: "D" },
    { name: "Kiler", icon: "K" },
    { name: "Dolap", icon: "Dl" },
  ];

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { name: loc.name },
      update: {},
      create: loc,
    });
  }

  // ===== CATEGORIES =====
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

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat },
      update: {},
      create: { name: cat },
    });
  }

  // ===== TEST ITEMS =====
  // Önce ID'leri çek
  const buzdolabi = await prisma.location.findUnique({ where: { name: "Buzdolabı" } });
  const dondurucu = await prisma.location.findUnique({ where: { name: "Dondurucu" } });
  const kiler = await prisma.location.findUnique({ where: { name: "Kiler" } });

  const sebze = await prisma.category.findUnique({ where: { name: "Sebze" } });
  const sutUrunleri = await prisma.category.findUnique({ where: { name: "Süt Ürünleri" } });
  const etTavuk = await prisma.category.findUnique({ where: { name: "Et & Tavuk" } });
  const kuruGida = await prisma.category.findUnique({ where: { name: "Kuru Gıda" } });

  // Mevcut test ürünlerini temizle (varsa)
  await prisma.item.deleteMany({
    where: {
      name: { in: ["Domates", "Süt", "Pirinç", "Tavuk göğsü", "Yumurta", "Soğan", "Yoğurt"] },
    },
  });

  // Yeni test ürünleri
  const testItems = [
  {
    name: "Tavuk göğsü",
    quantity: 500,
    unit: "g",
    unitPrice: 0.4,
    expiryDate: daysFromNow(1),
    locationId: dondurucu.id,
    categoryId: etTavuk.id,
  },
  {
    name: "Domates",
    quantity: 3,
    unit: "adet",
    unitPrice: 8,
    expiryDate: daysFromNow(2),
    locationId: buzdolabi.id,
    categoryId: sebze.id,
  },
  {
    name: "Süt",
    quantity: 1,
    unit: "L",
    unitPrice: 45,
    expiryDate: daysFromNow(5),
    locationId: buzdolabi.id,
    categoryId: sutUrunleri.id,
  },
  {
    name: "Yoğurt",
    quantity: 500,
    unit: "g",
    unitPrice: 0.08,
    expiryDate: daysFromNow(7),
    locationId: buzdolabi.id,
    categoryId: sutUrunleri.id,
  },
  {
    name: "Yumurta",
    quantity: 10,
    unit: "adet",
    unitPrice: 7,
    expiryDate: daysFromNow(14),
    locationId: buzdolabi.id,
    categoryId: sutUrunleri.id,
  },
  {
    name: "Soğan",
    quantity: 2,
    unit: "kg",
    unitPrice: 25,
    expiryDate: daysFromNow(30),
    locationId: kiler.id,
    categoryId: sebze.id,
  },
  {
    name: "Pirinç",
    quantity: 2,
    unit: "kg",
    unitPrice: 80,
    expiryDate: daysFromNow(180),
    locationId: kiler.id,
    categoryId: kuruGida.id,
  },
];

  for (const item of testItems) {
    await prisma.item.create({ data: item });
  }

  console.log("Seed data başarıyla oluşturuldu");
  console.log(`- ${locations.length} lokasyon`);
  console.log(`- ${categories.length} kategori`);
  console.log(`- ${testItems.length} test ürünü`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect()); 
