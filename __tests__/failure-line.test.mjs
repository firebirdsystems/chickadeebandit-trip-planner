import { describe, it, expect } from "vitest";
import { failureLine, uploadFailureLine } from "../src/logic.js";

const err = (props, message = "hub text") => Object.assign(new Error(message), props);
const words = { action: "save the item", thing: "item" };

describe("failureLine", () => {
  it("names a duplicate by code, or by the hub's text while production lags", () => {
    expect(failureLine(err({ status: 400, code: "UNIQUE_CONSTRAINT" }), words)).toBe("That item already exists.");
    expect(failureLine(err({ status: 400 }, "UNIQUE constraint failed: x.id"), words)).toBe("That item already exists.");
  });
  it("names a refusal without asking for a retry", () => {
    expect(failureLine(err({ status: 403 }), words)).toBe("You don’t have permission to save the item.");
    expect(failureLine(err({ status: 507 }), words)).toBe("The household’s storage is full — free up space first.");
  });
  it("splits a write that changed nothing by the caller's re-read", () => {
    expect(failureLine(null, { ...words, found: false })).toBe("This item has been removed.");
    expect(failureLine(null, { ...words, found: true, guarded: true })).toBe("This item was changed by someone else — check it first.");
    expect(failureLine(err({ status: 409 }), { ...words, found: false })).toBe("This item has been removed.");
  });
  it("reads a row still there after a plain WHERE id = ? write as the row policy refusing it", () => {
    expect(failureLine(null, { ...words, found: true })).toBe("You don’t have permission to save the item.");
  });
  it("says neither removed nor changed when the re-read itself failed", () => {
    expect(failureLine(null, { ...words, found: null })).toBe("Couldn’t save the item — try again.");
    expect(failureLine(null, { ...words, found: null, guarded: true })).toBe("Couldn’t save the item — try again.");
  });
  it("reads a 404 as removed and a bare 409 as changed when there is no re-read", () => {
    expect(failureLine(err({ status: 404 }), words)).toBe("This item has been removed.");
    expect(failureLine(err({ status: 409 }), words)).toBe("This item was changed by someone else — check it first.");
  });
  it("asks for a retry only when retrying can work", () => {
    for (const e of [err({}), err({ status: 500 }), err({ status: 503 }), err({ status: 400 }), new TypeError("Failed to fetch"), undefined]) {
      expect(failureLine(e, words)).toBe("Couldn’t save the item — try again.");
    }
  });
  it("keeps a line the app wrote for the user, and never shows hub text", () => {
    expect(failureLine(err({ forUser: true }, "Pick a date first."), words)).toBe("Pick a date first.");
    expect(failureLine(err({ status: 500 }, "D1_ERROR: boom"), words)).not.toMatch(/D1_ERROR/);
  });
});

// The hub's answers, from files-handler.ts handleFileUpload and documents-handler.ts:
// 413 too large, 415 a type it does not take, 403 a write ACL, 429 a rate limit, 507
// storage full, 400 a malformed form or filename. The SDK's upload puts `status` on its
// Error (0 when nothing answered); the page's documents call does the same.
describe("uploadFailureLine", () => {
  const doc = { action: "upload the document", thing: "document" };
  it("names the file's own refusals", () => {
    expect(uploadFailureLine(err({ status: 413 }, "File too large (max 10 MB)"), doc)).toBe("That file is too large.");
    expect(uploadFailureLine(err({ status: 415 }, "File type not allowed: x"), doc)).toBe("That kind of file can’t be uploaded.");
  });
  it("gives the rest the template's lines", () => {
    expect(uploadFailureLine(err({ status: 403 }, "Document writes require an adult member"), doc)).toBe("You don’t have permission to upload the document.");
    expect(uploadFailureLine(err({ status: 507 }, "Storage limit exceeded"), doc)).toBe("The household’s storage is full — free up space first.");
    expect(uploadFailureLine(err({ status: 429 }, "Too many requests"), doc)).toBe("Too many tries — wait a minute and try again.");
    for (const e of [err({ status: 0 }, "Network error"), err({ status: 400 }, "Invalid or overlong filename"), err({ status: 502 }), new TypeError("Failed to fetch")]) {
      expect(uploadFailureLine(e, doc)).toBe("Couldn’t upload the document — try again.");
    }
  });
});
