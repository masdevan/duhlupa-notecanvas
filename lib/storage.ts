import type { AppState, Tab, TablesState, TableTab } from "./types";

const STORAGE_KEY = "duhlupa-tabs";
const TABLES_KEY = "duhlupa-tables";

export function isValidState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") {
    return false;
  }
  const s = value as Record<string, unknown>;
  return (
    Array.isArray(s.tabs) &&
    s.tabs.length > 0 &&
    s.tabs.every(
      (tab) =>
        typeof tab === "object" &&
        tab !== null &&
        typeof (tab as Tab).id === "number" &&
        typeof (tab as Tab).content === "string",
    ) &&
    typeof s.activeId === "number" &&
    typeof s.counter === "number" &&
    (typeof s.wrapWidth === "number" || s.wrapWidth === null) &&
    typeof s.accentColor === "string" &&
    typeof s.textColor === "string" &&
    typeof s.fontFamily === "string"
  );
}

export function saveState(next: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export function defaultState(): AppState {
  return {
    tabs: [{ id: 1, content: "" }],
    activeId: 1,
    counter: 1,
    wrapWidth: null,
    accentColor: "#39bff3",
    textColor: "#f5f5f5",
    fontFamily: "mono",
  };
}

export function initialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : null;
    if (isValidState(stored)) {
      return stored;
    }
  } catch {
    return defaultState();
  }
  return defaultState();
}

function isValidTablesState(value: unknown): value is TablesState {
  if (!value || typeof value !== "object") {
    return false;
  }
  const s = value as Record<string, unknown>;
  return (
    Array.isArray(s.tables) &&
    s.tables.every((t) => {
      if (typeof t !== "object" || t === null) {
        return false;
      }
      const tab = t as Record<string, unknown>;
      return (
        typeof tab.id === "number" &&
        (typeof tab.name === "string" || tab.name === undefined) &&
        Array.isArray(tab.columns) &&
        (tab.colWidths === undefined ||
          (Array.isArray(tab.colWidths) &&
            tab.colWidths.every((w) => typeof w === "number"))) &&
        tab.columns.every((c) => typeof c === "string") &&
        Array.isArray(tab.rows) &&
        tab.rows.every(
          (row) =>
            Array.isArray(row) && row.every((cell) => typeof cell === "string"),
        )
      );
    }) &&
    typeof s.activeId === "number" &&
    typeof s.counter === "number"
  );
}

export function defaultTablesState(): TablesState {
  return {
    tables: [
      {
        id: 1,
        name: "Untitled",
        columns: ["Column 1"],
        colWidths: [200],
        rows: [[""]],
      },
    ],
    activeId: 1,
    counter: 1,
  };
}

export function initialTablesState(): TablesState {
  try {
    const raw = localStorage.getItem(TABLES_KEY);
    const stored = raw ? JSON.parse(raw) : null;
    if (isValidTablesState(stored)) {
      return {
        ...stored,
        tables: stored.tables.map((table) => ({
          ...table,
          name:
            typeof table.name === "string"
              ? table.name
              : (table.columns[0] ?? "Untitled"),
          colWidths: Array.isArray(table.colWidths)
            ? table.colWidths
            : table.columns.map(() => 200),
        })),
      };
    }
  } catch {
    return defaultTablesState();
  }
  return defaultTablesState();
}

export function saveTablesState(next: TablesState) {
  try {
    localStorage.setItem(TABLES_KEY, JSON.stringify(next));
  } catch {}
}

export type { TableTab };
