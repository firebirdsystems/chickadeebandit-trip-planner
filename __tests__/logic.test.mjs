import { describe, it, expect } from "vitest";
import {
  nightCount,
  dateRange,
  dayLabel,
  formatDateRange,
  packingProgress,
  sortItinerary,
  CAT_ICONS,
  STATUS_LABELS,
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
