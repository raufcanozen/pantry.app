import { prisma } from "~/db.server.js";


export async function getAutoSuggestions() {
  const consumedItems = await prisma.item.findMany({
    where: { consumedAt: { not: null } },
    select: {
      name: true,
      purchasedAt: true,
      consumedAt: true,
    },
  });

 
  const byName = {};
  for (const item of consumedItems) {
    const lower = item.name.toLowerCase();
    if (!byName[lower]) byName[lower] = [];
    byName[lower].push(item);
  }

  
  const avgLifespan = {};
  for (const [name, items] of Object.entries(byName)) {
    if (items.length < 1) continue;
    const totalDays = items.reduce((sum, item) => {
      const days = (new Date(item.consumedAt) - new Date(item.purchasedAt)) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    avgLifespan[name] = totalDays / items.length;
  }

  
  const activeItems = await prisma.item.findMany({
    where: { consumedAt: null },
    select: { name: true },
  });
  const activeNames = new Set(activeItems.map((i) => i.name.toLowerCase()));

  
  const inList = await prisma.shoppingListItem.findMany({
    where: { isPurchased: false },
    select: { name: true },
  });
  const inListNames = new Set(inList.map((i) => i.name.toLowerCase()));

  
  const lastPurchases = await prisma.item.findMany({
    where: { name: { in: Object.keys(byName).map((n) => n) } },
    orderBy: { purchasedAt: "desc" },
    select: { name: true, purchasedAt: true },
  });

  const lastPurchaseByName = {};
  for (const item of lastPurchases) {
    const lower = item.name.toLowerCase();
    if (!lastPurchaseByName[lower]) {
      lastPurchaseByName[lower] = item.purchasedAt;
    }
  }

  
  const suggestions = [];
  for (const [name, avg] of Object.entries(avgLifespan)) {
    
    if (activeNames.has(name) || inListNames.has(name)) continue;

    const lastPurchase = lastPurchaseByName[name];
    if (!lastPurchase) continue;

    const daysSinceLastPurchase = (new Date() - new Date(lastPurchase)) / (1000 * 60 * 60 * 24);

    
    if (daysSinceLastPurchase >= avg * 0.7) {
      suggestions.push({
        name,
        daysSinceLastPurchase: Math.round(daysSinceLastPurchase),
        avgLifespan: Math.round(avg),
      });
    }
  }

  return suggestions;
}