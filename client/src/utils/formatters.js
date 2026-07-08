/**
 * Format a Firestore Timestamp or JS Date for display, e.g. "7 Jul 2026".
 * Returns "—" if the value is missing.
 */
export function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
 
/**
 * Format a Firestore Timestamp or JS Date with time, e.g. "7 Jul 2026, 14:32".
 */
export function formatDateTime(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return date.toLocaleString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
 
/**
 * Convert a Firestore Timestamp / JS Date to the yyyy-MM-dd string that
 * <input type="date"> expects. Returns "" if unset.
 */
export function timestampToDateInput(value) {
  if (!value) return "";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return date.toISOString().split("T")[0];
}
 
/**
 * Returns true if a Firestore Timestamp / JS Date is strictly before today
 * (comparing by calendar day, not time-of-day — a service date of "today"
 * is not considered past due yet). Returns false if the value is missing.
 *
 * Used to stop admins from sending a "Service Due" reminder for a vehicle
 * whose service date has already passed.
 */
export function isPastDate(value) {
  if (!value) return false;
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
 
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return startOfDay(date) < startOfDay(new Date());
}