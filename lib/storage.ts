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
      (typeof stored.wrapWidth === "number" || stored.wrapWidth === null)
    ) {
      return stored;
    }
  } catch {
    return defaultState();
  }
  return defaultState();
}
