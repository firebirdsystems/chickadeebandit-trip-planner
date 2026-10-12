import { describe, it, expect } from "vitest";
import {
  nightCount,
  dateRange,
  dayLabel,
  formatDateRange,
  packingProgress,
  sortItinerary,
  outsideTripDates,
  safeHttpUrl,
  CAT_ICONS,
  STATUS_LABELS, searchableFields,
  supervisesPacking, canAddToPackingList, canEditPackingItem, collectPages,
  canRemoveDocument, deleteTripDescription,
} from "../src/logic.js";

// ── nightCount ────────────────────────────────────────────────────────────────

describe("nightCount", () => {
  it("returns 0 for same-day trips", () => {
    expect(nightCount("2026-07-10", "2026-07-10")).toBe(0);
  });

  it("returns correct nights for a weekend trip", () => {
    expect(nightCount("2026-08-14", "2026-08-16")).toBe(2);
  });

  it("returns correct nights for a two-week trip", () => {
    expect(nightCount("2026-07-10", "2026-07-24")).toBe(14);
  });

  it("handles month boundaries", () => {
    expect(nightCount("2026-01-29", "2026-02-02")).toBe(4);
  });

  it("handles year boundaries", () => {
    expect(nightCount("2025-12-28", "2026-01-03")).toBe(6);
  });
});

// ── dateRange ─────────────────────────────────────────────────────────────────

describe("dateRange", () => {
  it("returns a single date for a same-day trip", () => {
    expect(dateRange("2026-07-10", "2026-07-10")).toEqual(["2026-07-10"]);
  });

  it("returns the correct number of dates", () => {
    const range = dateRange("2026-08-14", "2026-08-16");
    expect(range).toHaveLength(3);
    expect(range[0]).toBe("2026-08-14");
    expect(range[2]).toBe("2026-08-16");
  });

  it("includes both start and end dates", () => {
    const range = dateRange("2026-06-01", "2026-06-05");
    expect(range[0]).toBe("2026-06-01");
    expect(range[range.length - 1]).toBe("2026-06-05");
  });

  it("handles month boundaries correctly", () => {
    const range = dateRange("2026-01-30", "2026-02-01");
    expect(range).toEqual(["2026-01-30", "2026-01-31", "2026-02-01"]);
  });
});

// ── dayLabel ──────────────────────────────────────────────────────────────────

describe("dayLabel", () => {
  it("returns a readable day string", () => {
    const label = dayLabel("2026-07-10");
    expect(label).toMatch(/Friday/);
    expect(label).toMatch(/Jul/);
    expect(label).toMatch(/10/);
  });

  it("includes weekday name", () => {
    const label = dayLabel("2026-08-14");
    expect(label).toMatch(/Friday/);
  });
});

// ── formatDateRange ───────────────────────────────────────────────────────────

describe("formatDateRange", () => {
  it("omits year from start when same year", () => {
    const result = formatDateRange("2026-07-10", "2026-07-24");
    expect(result).toMatch(/Jul 10/);
    expect(result).toMatch(/Jul 24, 2026/);
    expect(result).not.toMatch(/Jul 10, 2026 –/);
  });

  it("includes year in both dates when spanning years", () => {
    const result = formatDateRange("2025-12-28", "2026-01-03");
    expect(result).toMatch(/2025/);
    expect(result).toMatch(/2026/);
  });

  it("contains an em-dash separator", () => {
    expect(formatDateRange("2026-06-01", "2026-06-07")).toMatch(/–/);
  });
});

// ── packingProgress ───────────────────────────────────────────────────────────

describe("packingProgress", () => {
  it("returns null for an empty list", () => {
    expect(packingProgress([])).toBeNull();
  });

  it("returns 0 when nothing is checked", () => {
    const items = [{ checked: 0 }, { checked: 0 }];
    expect(packingProgress(items)).toBe(0);
  });

  it("returns 100 when everything is checked", () => {
    const items = [{ checked: 1 }, { checked: 1 }];
    expect(packingProgress(items)).toBe(100);
  });

  it("returns 50 when half are checked", () => {
    const items = [{ checked: 1 }, { checked: 0 }];
    expect(packingProgress(items)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    const items = [{ checked: 1 }, { checked: 0 }, { checked: 0 }];
    expect(packingProgress(items)).toBe(33);
  });
});

// ── sortItinerary ─────────────────────────────────────────────────────────────

describe("sortItinerary", () => {
  it("sorts dated items before undated items", () => {
    const items = [
      { id: "c", item_date: null,         sort_order: 0 },
      { id: "a", item_date: "2026-07-10", sort_order: 0 },
    ];
    const sorted = sortItinerary(items);
    expect(sorted[0].id).toBe("a");
    expect(sorted[1].id).toBe("c");
  });

  it("sorts by date ascending", () => {
    const items = [
      { id: "b", item_date: "2026-07-12", sort_order: 0 },
      { id: "a", item_date: "2026-07-10", sort_order: 0 },
    ];
    const sorted = sortItinerary(items);
    expect(sorted[0].id).toBe("a");
    expect(sorted[1].id).toBe("b");
  });

  it("sorts by sort_order within the same date", () => {
    const items = [
      { id: "b", item_date: "2026-07-10", sort_order: 2 },
      { id: "a", item_date: "2026-07-10", sort_order: 0 },
      { id: "c", item_date: "2026-07-10", sort_order: 1 },
    ];
    const sorted = sortItinerary(items);
    expect(sorted.map(i => i.id)).toEqual(["a", "c", "b"]);
  });

  it("does not mutate the original array", () => {
    const items = [
      { id: "b", item_date: "2026-07-12", sort_order: 0 },
      { id: "a", item_date: "2026-07-10", sort_order: 0 },
    ];
    sortItinerary(items);
    expect(items[0].id).toBe("b");
  });
});

// ── constants ─────────────────────────────────────────────────────────────────

describe("CAT_ICONS", () => {
  it("has an icon for each category", () => {
    for (const cat of ["transport", "accommodation", "activity", "restaurant", "other"]) {
      expect(CAT_ICONS[cat]).toBeTruthy();
    }
  });
});

describe("STATUS_LABELS", () => {
  it("has a label for each status", () => {
    for (const status of ["planning", "confirmed", "completed", "cancelled"]) {
      expect(STATUS_LABELS[status]).toBeTruthy();
    }
  });
});

describe("safeHttpUrl", () => {
  it("allows HTTP and HTTPS URLs", () => {
    expect(safeHttpUrl("https://example.com/booking")).toBe("https://example.com/booking");
    expect(safeHttpUrl("http://example.com/booking")).toBe("http://example.com/booking");
  });

  it("rejects script, data, relative, and malformed URLs", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("data:text/html,x")).toBeNull();
    expect(safeHttpUrl("/relative")).toBeNull();
    expect(safeHttpUrl("not a url")).toBeNull();
  });
});

describe("searchableFields", () => {
  it("matches on the destination, which is how a trip is remembered", () => {
    const fields = searchableFields({ title: "Half term", destination: "Lisbon", notes: "flights booked", status: "planned" });
    expect(fields).toContain("Lisbon");
    expect(fields).toContain("flights booked");
  });
});

// ── outsideTripDates ──────────────────────────────────────────────────────────

describe("outsideTripDates", () => {
  const items = [
    { id: "after",  item_date: "2026-07-20", sort_order: 0 },
    { id: "in",     item_date: "2026-07-12", sort_order: 0 },
    { id: "first",  item_date: "2026-07-10", sort_order: 0 },
    { id: "last",   item_date: "2026-07-14", sort_order: 0 },
    { id: "before", item_date: "2026-07-01", sort_order: 0 },
    { id: "undated", item_date: null, sort_order: 0 },
  ];

  it("returns dated items before the start or after the end, in date order", () => {
    expect(outsideTripDates(items, "2026-07-10", "2026-07-14").map(i => i.id)).toEqual(["before", "after"]);
  });

  it("keeps both boundary days inside the trip and leaves undated items to Unscheduled", () => {
    const ids = outsideTripDates(items, "2026-07-10", "2026-07-14").map(i => i.id);
    expect(ids).not.toContain("first");
    expect(ids).not.toContain("last");
    expect(ids).not.toContain("undated");
  });

  it("is empty when every dated item fits the trip", () => {
    expect(outsideTripDates(items, "2026-06-01", "2026-08-01")).toEqual([]);
  });
});

describe("who supervises packing lists", () => {
  const adult = { id: "a1", role: "adult" };
  const child = { id: "c1", role: "child" };
  const participant = { tenantKind: "shared_space", spaceKind: "general", isAdmin: false };
  const steward = { tenantKind: "shared_space", spaceKind: "general", isAdmin: true };
  const coparentSteward = { tenantKind: "shared_space", spaceKind: "coparenting", isAdmin: true };

  it("a household is the default, where any adult supervises", () => {
    expect(supervisesPacking(adult)).toBe(true);
    expect(supervisesPacking(child)).toBe(false);
    expect(supervisesPacking(null)).toBe(false);
    expect(supervisesPacking(child, { tenantKind: "household", isAdmin: true })).toBe(false);
  });

  it("only the steward supervises in a shared space", () => {
    expect(supervisesPacking(adult, participant)).toBe(false);
    expect(supervisesPacking(adult, steward)).toBe(true);
    expect(supervisesPacking(adult, coparentSteward)).toBe(true);
  });

  it("lets any adult add to the shared list, and anyone to their own", () => {
    for (const tenant of [undefined, participant, steward]) {
      expect(canAddToPackingList(null, adult, tenant)).toBe(true);
      expect(canAddToPackingList("a1", adult, tenant)).toBe(true);
    }
    expect(canAddToPackingList("c1", child)).toBe(true);
  });

  it("keeps the shared list from a child, whose write the hub refuses", () => {
    expect(canAddToPackingList(null, child)).toBe(false);
    expect(canAddToPackingList(null, null)).toBe(false);
    expect(canEditPackingItem({ shared: true, member_id: null }, child)).toBe(false);
  });

  it("lets only a supervisor add to another traveler's list", () => {
    expect(canAddToPackingList("c1", adult)).toBe(true);
    expect(canAddToPackingList("a1", child)).toBe(false);
    expect(canAddToPackingList("c1", adult, participant)).toBe(false);
    expect(canAddToPackingList("c1", adult, steward)).toBe(true);
  });

  it("lets any adult edit shared items, and anyone their own items", () => {
    expect(canEditPackingItem({ shared: true, member_id: null }, adult, participant)).toBe(true);
    expect(canEditPackingItem({ shared: true, member_id: null }, adult)).toBe(true);
    expect(canEditPackingItem({ shared: false, member_id: "a1" }, adult, participant)).toBe(true);
    expect(canEditPackingItem({ shared: false, member_id: "c1" }, child)).toBe(true);
  });

  it("lets only a supervisor edit another traveler's item", () => {
    const theirs = { shared: false, member_id: "c1" };
    expect(canEditPackingItem(theirs, adult)).toBe(true);
    expect(canEditPackingItem(theirs, adult, participant)).toBe(false);
    expect(canEditPackingItem(theirs, adult, steward)).toBe(true);
    expect(canEditPackingItem({ shared: false, member_id: "a1" }, child)).toBe(false);
  });
});

describe("collectPages", () => {
  const pages = { start: { items: [1, 2], next: "b" }, b: { items: [3], next: "c" }, c: { items: [4], next: null } };

  it("follows the cursor to the last page and returns every item in order", async () => {
    const asked = [];
    const all = await collectPages(async cursor => { asked.push(cursor); return pages[cursor ?? "start"]; });
    expect(all).toEqual([1, 2, 3, 4]);
    expect(asked).toEqual([null, "b", "c"]);
  });

  it("returns a single page that names no next one", async () => {
    expect(await collectPages(async () => ({ items: ["only"], next: null }))).toEqual(["only"]);
    expect(await collectPages(async () => ({ items: [] }))).toEqual([]);
  });

  it("fails rather than return the pages read before one that could not be", async () => {
    await expect(collectPages(async cursor => {
      if (cursor === "b") throw new Error("offline");
      return pages[cursor ?? "start"];
    })).rejects.toThrow("offline");
  });

  it("stops on a list that never ends", async () => {
    await expect(collectPages(async () => ({ items: [0], next: "again" }), 3)).rejects.toThrow("did not end");
  });
});

describe("a trip's documents", () => {
  const adult = { id: "a1", role: "adult" };
  const mine = { id: "d1", ownerId: "a1" };
  const theirs = { id: "d2", ownerId: "b2" };

  it("lets the uploader and the admin remove a document, and no other adult", () => {
    expect(canRemoveDocument(mine, adult, false)).toBe(true);
    expect(canRemoveDocument(theirs, adult, false)).toBe(false);
    expect(canRemoveDocument(theirs, adult, true)).toBe(true);
    expect(canRemoveDocument(theirs, null, false)).toBe(false);
    expect(canRemoveDocument({ id: "d3" }, { id: undefined }, false)).toBe(false);
  });

  it("says a plain delete when the trip has no documents", () => {
    expect(deleteTripDescription()).toBe("This will permanently remove the trip, all itinerary items, and packing lists.");
  });

  it("names the documents that go with the trip and the ones that stay", () => {
    expect(deleteTripDescription({ removable: 1 })).toMatch(/and the document you can remove from it\.$/);
    expect(deleteTripDescription({ removable: 3 })).toMatch(/and 3 documents you can remove from it\.$/);
    const mixed = deleteTripDescription({ removable: 2, staying: 1 });
    expect(mixed).toMatch(/2 documents you can remove/);
    expect(mixed).toMatch(/One document uploaded by someone else will stay in Documents\.$/);
    expect(deleteTripDescription({ staying: 4 })).toMatch(/packing lists\. 4 documents uploaded by someone else will stay/);
  });

  it("says so when the documents could not be listed", () => {
    expect(deleteTripDescription({ unread: true })).toMatch(/could not be listed, so any uploaded to it will stay in Documents\.$/);
  });
});
