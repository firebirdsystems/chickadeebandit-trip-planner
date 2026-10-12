/**
 * Pure business logic for the Trip Planner app.
 * No DOM, no fetch — importable in both browser and test environments.
 */

export const CAT_ICONS = {
  transport:     "plane",
  accommodation: "house",
  activity:      "ticket",
  restaurant:    "cloche",
  other:         "pinboard",
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
  // Anchored at UTC midnight and stepped with setUTCDate: "T00:00:00" is a
  // LOCAL instant, and toISOString() then reads it back in UTC — a day early
  // west of Greenwich. A fixed +86400000 also skips or repeats a day across a
  // DST boundary; calendar arithmetic in UTC does neither.
  const dates = [];
  const d = new Date(start + "T00:00:00Z");
  const last = new Date(end + "T00:00:00Z");
  while (d <= last) {
    dates.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
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

/**
 * Dated items that fall outside the trip's start–end range, in itinerary order.
 * Shortening a trip leaves these behind; the day-by-day view walks only the
 * trip's own dates, so without their own section they are never drawn — and
 * an item that is never drawn cannot be edited or removed.
 */
export function outsideTripDates(items, start, end) {
  return sortItinerary(items.filter(i => i.item_date && (i.item_date < start || i.item_date > end)));
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

/**
 * Fields the in-app search matches against (see hub-sdk `searchMatch`).
 * Destination and notes count as well as the title — a trip is
 * remembered as "the Lisbon one", which is the destination.
 */
export function searchableFields(item) {
  return [item.title, item.destination, item.notes, item.status];
}

function isAdultMember(member) {
  return !!member && (member.role === "adult" || member.role === "admin");
}

/**
 * Whether a member sees and edits other travelers' personal packing lists.
 * Mirrors the hub's rule for the packing_items table (owner_only): any adult
 * in a household, and only the steward in a shared space. Anyone else reads
 * and writes their own list alone.
 */
export function supervisesPacking(member, { tenantKind = "household", isAdmin = false } = {}) {
  return tenantKind === "household" ? isAdultMember(member) : isAdmin === true;
}

/** Whether a member may add to the list belonging to `listMemberId`. Null is
 *  the shared list, which any adult adds to (the hub's adult_writable rule for
 *  shared_packing_items); a personal list is for its owner and whoever
 *  supervises. */
export function canAddToPackingList(listMemberId, member, tenant) {
  if (listMemberId === null) return isAdultMember(member);
  return listMemberId === member?.id || supervisesPacking(member, tenant);
}

/** Whether a member may tick or remove a packing item: any adult on the shared
 *  list, anyone on their own items, and other travelers' items only for
 *  whoever supervises. */
export function canEditPackingItem(item, member, tenant) {
  if (item.shared) return isAdultMember(member);
  return item.member_id === member?.id || supervisesPacking(member, tenant);
}

/**
 * Every item of a list the hub serves a page at a time. `fetchPage(cursor)`
 * resolves to `{ items, next }`, where `next` is the cursor for the following
 * page or null on the last one. Throws what `fetchPage` throws, so a caller
 * never mistakes a partial list for the whole one. `maxPages` bounds a server
 * that keeps handing back a cursor.
 */
export async function collectPages(fetchPage, maxPages = 100) {
  const all = [];
  let cursor = null;
  for (let page = 0; page < maxPages; page++) {
    const { items, next } = await fetchPage(cursor);
    all.push(...(items ?? []));
    if (!next) return all;
    cursor = next;
  }
  throw new Error("The list did not end.");
}

/**
 * Whether a member may remove a document uploaded to a trip. The hub lets a
 * document go only for whoever uploaded it and for the admin (the steward in a
 * shared space); being an adult is not enough.
 */
export function canRemoveDocument(doc, member, isAdmin) {
  return isAdmin === true || (!!member && !!doc?.ownerId && doc.ownerId === member.id);
}

/**
 * What deleting a trip will do, for the confirmation. `removable` documents go
 * with the trip; `staying` ones were uploaded by someone else and remain in
 * Documents; `unread` is true when the trip's documents could not be listed,
 * so neither count is known.
 */
export function deleteTripDescription({ removable = 0, staying = 0, unread = false } = {}) {
  const count = (n, one, many) => (n === 1 ? one : `${n} ${many}`);
  let text = "This will permanently remove the trip, all itinerary items, and packing lists";
  if (removable) text += `, and ${count(removable, "the document", "documents")} you can remove from it`;
  text += ".";
  if (staying) text += ` ${count(staying, "One document", "documents")} uploaded by someone else will stay in Documents.`;
  if (unread) text += " Its documents could not be listed, so any uploaded to it will stay in Documents.";
  return text;
}
