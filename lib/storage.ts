import type { AppState, Tab } from "./types";

const STORAGE_KEY = "duhlupa-tabs";

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
