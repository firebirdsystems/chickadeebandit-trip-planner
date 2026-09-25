import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { describe, it, expect } from "vitest";
import { STATUS_LABELS, CAT_ICONS } from "../src/logic.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(__dirname, "../manifest.json"), "utf-8"));
const page = readFileSync(join(__dirname, "../src/index.html"), "utf-8");

const item = manifest.shareable?.trip;

/**
 * A share link is an anonymous read that skips row policies, so the declared
 * columns are the whole public surface. The share panel tells the adult what
 * stays in the household; these hold the manifest to that sentence.
 */
describe("shareable.trip", () => {
  it("anchors on the trips table by id", () => {
    expect(item.table).toBe("trips");
    expect(item.id_column ?? "id").toBe("id");
    expect(item.title_column).toBe("title");
  });

  it("projects the destination, dates and status of the trip, and not its notes", () => {
    expect(item.columns.map((c) => c.column)).toEqual(["destination", "start_date", "end_date", "status"]);
  });

  // A confirmation code is a credential: with a surname it opens most airline
  // and hotel bookings. A booking url is often a "manage booking" link that
  // carries the same thing in its query string. Neither belongs on a page that
  // anyone holding the link can read.
  it("keeps confirmation codes and booking links off the itinerary feed", () => {
    expect(item.feed.table).toBe("itinerary_items");
    expect(item.feed.fk_column).toBe("trip_id");
    const cols = item.feed.columns.map((c) => c.column);
    expect(cols).toEqual(["title", "item_date", "time", "category", "description"]);
    expect(JSON.stringify(item)).not.toContain("confirmation_code");
    expect(JSON.stringify(item)).not.toContain("booking_url");
    expect(JSON.stringify(item)).not.toContain("created_by");
  });

  it("never reaches packing lists or trip members", () => {
    const tables = JSON.stringify(item);
    for (const t of ["packing_items", "shared_packing_items", "trip_members"]) {
      expect(tables).not.toContain(`"${t}"`);
    }
  });

  it("relabels every stored status and category the app can write", () => {
    const status = item.columns.find((c) => c.column === "status");
    expect(Object.keys(status.value_labels).sort()).toEqual(Object.keys(STATUS_LABELS).sort());
    expect(status.value_labels).toEqual(STATUS_LABELS);
    const category = item.feed.columns.find((c) => c.column === "category");
    expect(Object.keys(category.value_labels).sort()).toEqual(Object.keys(CAT_ICONS).sort());
  });

  // The feed filters and sorts in SQL; a ciphertext column there orders by the
  // encrypted bytes. This app runs with encryption off, and item_date is
  // declared plaintext besides, so the order is by day.
  it("orders the itinerary by day on a plaintext column", () => {
    expect(item.feed.order_column).toBe("item_date");
    expect(item.feed.order).toBe("oldest");
    expect(manifest.db_plaintext_columns).toContain("item_date");
  });

  it("is read-only and is the item type the page mints", () => {
    expect(item.submit).toBeUndefined();
    expect(item.files).toBeUndefined();
    expect(Object.keys(manifest.shareable)).toEqual(["trip"]);
    expect(page).toMatch(/itemType:\s*"trip"/);
  });

  it("tells the sharer what stays in the household", () => {
    const scope = page.match(/scopeHtml:\s*\(\)\s*=>\s*"([^"]+)"/)?.[1] ?? "";
    const kept = scope.split("stay in the household")[0].split(".").pop();
    for (const phrase of ["notes", "booking links", "confirmation codes", "packing lists", "documents"]) {
      expect(kept).toContain(phrase);
    }
  });
});
