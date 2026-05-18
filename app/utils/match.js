// Malzeme adlarını karşılaştırma için normalize eder
export function normalize(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

// İki malzeme adı uyuşuyor mu? (kısmi eşleşme dahil)
export function ingredientMatches(inventoryName, recipeName) {
  const a = normalize(inventoryName);
  const b = normalize(recipeName);

  // Tam eşleşme
  if (a === b) return true;

  // Biri diğerinin içinde geçiyor mu?
  // örn: "Tavuk göğsü" inventory'de, "tavuk göğsü" tarif'te
  // örn: "domates" inventory, "domates" tarif → eşleşir
  // örn: "kuru fasulye" inventory, "fasulye" tarif → eşleşir
  if (a.includes(b) || b.includes(a)) return true;

  return false;
}