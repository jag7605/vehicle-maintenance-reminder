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
 * Used by pages that also need the sent time, not just the date.
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