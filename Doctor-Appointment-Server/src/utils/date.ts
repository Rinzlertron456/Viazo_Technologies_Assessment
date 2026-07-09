/**
 * Parses a "YYYY-MM-DD" string as LOCAL midnight instead of UTC midnight.
 *
 * `new Date("2026-07-10")` is interpreted as UTC midnight, which in IST becomes
 * 2026-07-09 18:30 — causing "today" bookings to fall into yesterday's bucket and
 * disappear from the receptionist queue / doctor "Today" filter. Appending
 * "T00:00:00" anchors the value to the server's local timezone.
 */
export function parseLocalDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return new Date(`${value.trim()}T00:00:00`);
  }
  return new Date(value);
}
