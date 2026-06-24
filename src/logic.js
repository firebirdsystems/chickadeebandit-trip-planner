/**
 * Pure business logic for the Trip Planner app.
 * No DOM, no fetch — importable in both browser and test environments.
 */

export const CAT_ICONS = {
  transport:     "✈️",
  accommodation: "🏨",
  activity:      "🎭",
  restaurant:    "🍽️",
  other:         "📌",
};

export const STATUS_LABELS = {
  planning:  "Planning",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Number of nights between two YYYY-MM-DD date strings. */
export function nightCount(start, end) {
  return Math.round(
    (new Date(end + "T00:00:00") - new Date(start + "T00:00:00")) / 86400000
  );
}

/** Array of YYYY-MM-DD strings from start through end (inclusive). */
export function dateRange(start, end) {
  const dates = [];
  let d = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (d <= last) {
    dates.push(d.toISOString().slice(0, 10));
    d = new Date(d.getTime() + 86400000);
  }
  return dates;
}

/** "Monday, Jun 15" from a YYYY-MM-DD string. */
export function dayLabel(dateStr) {
  return new Date(dateStr + "T00:00:00")
    .toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

/** "Jun 15 – Jul 2, 2026" (or cross-year variant). */
export function formatDateRange(start, end) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end   + "T00:00:00");
  const mo = { month: "short", day: "numeric" };
  const yr = { month: "short", day: "numeric", year: "numeric" };
  if (s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString("en-US", mo)} – ${e.toLocaleDateString("en-US", yr)}`;
  }
  return `${s.toLocaleDateString("en-US", yr)} – ${e.toLocaleDateString("en-US", yr)}`;
}

/** Packing progress percentage (0–100) given a list of packing items. */
export function packingProgress(items) {
  if (!items.length) return null;
  return Math.round((items.filter(i => i.checked).length / items.length) * 100);
}

/** Sort itinerary items: dated items by date then sort_order; undated items last. */
export function sortItinerary(items) {
  return [...items].sort((a, b) => {
    const da = a.item_date ?? "zzzz";
    const db = b.item_date ?? "zzzz";
    if (da !== db) return da.localeCompare(db);
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

/** Return a normalized web URL, rejecting script and non-web schemes. */
export function safeHttpUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
