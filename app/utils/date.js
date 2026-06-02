export function daysUntil(date) {
  if (!date) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffMs = target - now;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function expiryStatus(date) {
  const days = daysUntil(date);
  if (days === null) return "none";
  if (days < 0) return "expired";
  if (days <= 3) return "critical";
  return "safe";
}

export function formatExpiry(date) {
  const days = daysUntil(date);
  if (days === null) return "Tarih yok";
  if (days < 0) return `${Math.abs(days)} gün geçti`;
  if (days === 0) return "Bugün";
  if (days === 1) return "Yarın";
  return `${days} gün`;
}
