import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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

  // ===== DISHES =====
  const existingDishCount = await prisma.dish.count();
  if (existingDishCount === 0) {
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
    console.log(`- ${dishes.length} yemek`);
  }

  console.log(`- ${locations.length} lokasyon`);
  console.log(`- ${categories.length} kategori`);
  console.log("Seed data hazır");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());