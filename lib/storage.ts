import type { AppState } from "./types";

const STORAGE_KEY = "duhlupa-tabs";

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
  };
}

export function initialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : null;
    if (
      stored &&
      Array.isArray(stored.tabs) &&
      stored.tabs.length > 0 &&
      typeof stored.activeId === "number" &&
      typeof stored.counter === "number" &&
      (typeof stored.wrapWidth === "number" || stored.wrapWidth === null) &&
      typeof stored.accentColor === "string" &&
      typeof stored.textColor === "string"
    ) {
      return stored;
    }
  } catch {
    return defaultState();
  }
  return defaultState();
}
