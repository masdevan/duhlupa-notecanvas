import { afterEach, describe, expect, it, vi } from "vitest";
import {
  defaultState,
  defaultTablesState,
  initialState,
  initialTablesState,
  isValidState,
} from "../../lib/storage";

function stubStorage(data: Record<string, string>) {
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data[key] ?? null,
    setItem: () => {},
    removeItem: () => {},
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isValidState", () => {
  it("accepts a valid state", () => {
    expect(isValidState(defaultState())).toBe(true);
  });

  it("rejects null, non-objects, and missing fields", () => {
    expect(isValidState(null)).toBe(false);
    expect(isValidState("text")).toBe(false);
    expect(isValidState({})).toBe(false);
  });

  it("rejects empty tabs and invalid contentPosition", () => {
    const malformed = JSON.parse(
      JSON.stringify(defaultState()),
    ) as Record<string, unknown>;
    malformed.tabs = [];
    expect(isValidState(malformed)).toBe(false);
    malformed.tabs = [{ id: 1, content: "" }];
    malformed.contentPosition = "top";
    expect(isValidState(malformed)).toBe(false);
  });
});

describe("initialState", () => {
  it("falls back to defaults when storage is empty", () => {
    stubStorage({});
    expect(initialState()).toEqual(defaultState());
  });

  it("falls back to defaults when storage holds invalid data", () => {
    stubStorage({ "duhlupa-tabs": JSON.stringify({ nope: true }) });
    expect(initialState()).toEqual(defaultState());
  });
});

describe("initialTablesState", () => {
  it("falls back to defaults when storage is empty", () => {
    stubStorage({});
    expect(initialTablesState()).toEqual(defaultTablesState());
  });

  it("normalizes legacy tables missing name and colWidths", () => {
    stubStorage({
      "duhlupa-tables": JSON.stringify({
        tables: [{ id: 1, columns: ["A"], rows: [["x"]] }],
        activeId: 1,
        counter: 1,
      }),
    });
    const state = initialTablesState();
    expect(state.tables[0].name).toBe("A");
    expect(state.tables[0].colWidths).toEqual([200]);
  });
});
