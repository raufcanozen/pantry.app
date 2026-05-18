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
  const buzdolabi = await prisma.location.findUnique({ where: { name: "Buzdolabı" } });
  const dondurucu = await prisma.location.findUnique({ where: { name: "Dondurucu" } });
  const kiler = await prisma.location.findUnique({ where: { name: "Kiler" } });

  const sebze = await prisma.category.findUnique({ where: { name: "Sebze" } });
  const sutUrunleri = await prisma.category.findUnique({ where: { name: "Süt Ürünleri" } });
  const etTavuk = await prisma.category.findUnique({ where: { name: "Et & Tavuk" } });
  const kuruGida = await prisma.category.findUnique({ where: { name: "Kuru Gıda" } });

  await prisma.item.deleteMany({
    where: {
      name: { in: ["Domates", "Süt", "Pirinç", "Tavuk göğsü", "Yumurta", "Soğan", "Yoğurt"] },
    },
  });

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

  // ===== DISHES (Yemekler) =====
  await prisma.dishIngredient.deleteMany();
  await prisma.dish.deleteMany();

  const dishes = [
    { name: "Mercimek Çorbası", ingredients: ["mercimek", "soğan", "havuç", "salça", "tereyağı"] },
    { name: "Ezogelin Çorbası", ingredients: ["mercimek", "bulgur", "pirinç", "soğan", "salça", "nane"] },
    { name: "Tavuk Sote", ingredients: ["tavuk göğsü", "soğan", "biber", "salça", "domates"] },
    { name: "Kıymalı Bezelye", ingredients: ["kıyma", "bezelye", "soğan", "salça", "havuç"] },
    { name: "Kuru Fasulye", ingredients: ["kuru fasulye", "soğan", "salça", "kıyma"] },
    { name: "Mercimek Yemeği", ingredients: ["yeşil mercimek", "pirinç", "soğan", "salça"] },
    { name: "Pilav", ingredients: ["pirinç", "tereyağı", "tuz"] },
    { name: "Bulgur Pilavı", ingredients: ["bulgur", "soğan", "salça", "tereyağı"] },
    { name: "Makarna", ingredients: ["makarna", "tereyağı", "tuz"] },
    { name: "Yoğurtlu Makarna", ingredients: ["makarna", "yoğurt", "sarımsak", "tereyağı"] },
    { name: "Köfte", ingredients: ["kıyma", "soğan", "ekmek", "yumurta", "tuz"] },
    { name: "Menemen", ingredients: ["yumurta", "domates", "biber", "soğan"] },
    { name: "Sahanda Yumurta", ingredients: ["yumurta", "tereyağı", "tuz"] },
    { name: "Omlet", ingredients: ["yumurta", "süt", "tuz"] },
    { name: "Peynirli Omlet", ingredients: ["yumurta", "peynir", "tereyağı"] },
    { name: "Patates Yemeği", ingredients: ["patates", "soğan", "salça", "havuç"] },
    { name: "Patates Kızartması", ingredients: ["patates", "yağ", "tuz"] },
    { name: "Tavuk Izgara", ingredients: ["tavuk göğsü", "tuz", "karabiber"] },
    { name: "Çoban Salata", ingredients: ["domates", "salatalık", "soğan", "biber", "maydanoz"] },
    { name: "Mevsim Salata", ingredients: ["marul", "domates", "salatalık", "limon"] },
    { name: "Gavurdağı Salata", ingredients: ["domates", "soğan", "ceviz", "nar ekşisi"] },
    { name: "Haydari", ingredients: ["yoğurt", "sarımsak", "dereotu"] },
    { name: "Cacık", ingredients: ["yoğurt", "salatalık", "sarımsak", "nane"] },
    { name: "Ezme", ingredients: ["domates", "biber", "soğan", "salça"] },
    { name: "Tost", ingredients: ["ekmek", "peynir", "tereyağı"] },
    { name: "Peynirli Sandviç", ingredients: ["ekmek", "peynir", "domates", "marul"] },
    { name: "Krep", ingredients: ["un", "süt", "yumurta", "şeker"] },
    { name: "Sütlaç", ingredients: ["pirinç", "süt", "şeker", "vanilya"] },
    { name: "Börek", ingredients: ["yufka", "peynir", "yumurta", "süt", "yağ"] },
    { name: "Kahvaltı Tabağı", ingredients: ["peynir", "zeytin", "domates", "salatalık", "ekmek"] },
  ];

  for (const dish of dishes) {
    await prisma.dish.create({
      data: {
        name: dish.name,
        ingredients: {
          create: dish.ingredients.map((ing) => ({ name: ing.toLowerCase() })),
        },
      },
    });
  }

  console.log("Seed data başarıyla oluşturuldu");
  console.log(`- ${locations.length} lokasyon`);
  console.log(`- ${categories.length} kategori`);
  console.log(`- ${testItems.length} test ürünü`);
  console.log(`- ${dishes.length} yemek`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());