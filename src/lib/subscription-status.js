/** @param {Date|string} endDate */
export function remainingDays(endDate) {
  const end = new Date(endDate);
  const now = new Date();
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);
  const nowDay = new Date(now);
  nowDay.setHours(0, 0, 0, 0);
  return Math.ceil((endDay - nowDay) / (1000 * 60 * 60 * 24));
}

/** @param {Date|string} endDate */
export function computeCachedStatus(endDate, expiringSoonDays = 7) {
  const days = remainingDays(endDate);
  if (days < 0) return "expired";
  if (days <= expiringSoonDays) return "expiring_soon";
  return "active";
}
