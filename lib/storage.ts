import type { AppState, Tab, TablesState, TableTab } from "./types";

const SETTINGS_KEY = "duhlupa-settings";
const DB_NAME = "duhlupa";
const STORE = "kv";
const TABS_KEY = "tabs";
const TABLES_KEY = "tables";
const WRAP_KEY = "wrap";

type TabsData = Pick<AppState, "tabs" | "activeId" | "counter" | "wrapWidth">;
type SettingsData = Pick<
  AppState,
  | "accentColor"
  | "textColor"
  | "fontFamily"
  | "letterSpacing"
  | "contentPosition"
>;

let tabsCache: TabsData | null = null;
let tablesCache: TablesState | null = null;
let wrapCache: boolean | null = null;
let writeQueue: Promise<void> = Promise.resolve();
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function idbGet(key: string): Promise<unknown> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
}

async function idbPut(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbClear(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function enqueueWrite(task: () => Promise<void>): Promise<void> {
  writeQueue = writeQueue.then(task, task);
  return writeQueue;
}

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
    typeof s.fontFamily === "string" &&
    typeof s.letterSpacing === "number" &&
    (s.contentPosition === "left" || s.contentPosition === "right")
  );
}

function isValidTabsData(value: unknown): value is TabsData {
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
    (typeof s.wrapWidth === "number" || s.wrapWidth === null)
  );
}

function defaultTabsData(): TabsData {
  return {
    tabs: [{ id: 1, content: "" }],
    activeId: 1,
    counter: 1,
    wrapWidth: null,
  };
}

function defaultSettings(): SettingsData {
  return {
    accentColor: "#39bff3",
    textColor: "#f5f5f5",
    fontFamily: "mono",
    letterSpacing: -0.5,
    contentPosition: "left",
  };
}

function loadSettings(): SettingsData {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Record<string, unknown>;
      if (
        typeof s.accentColor === "string" &&
        typeof s.textColor === "string" &&
        typeof s.fontFamily === "string" &&
        typeof s.letterSpacing === "number" &&
        (s.contentPosition === "left" || s.contentPosition === "right")
      ) {
        return s as unknown as SettingsData;
      }
    }
  } catch {}
  return defaultSettings();
}

function saveSettings(settings: SettingsData) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export function defaultState(): AppState {
  return { ...defaultTabsData(), ...defaultSettings() };
}

export function initialState(): AppState {
  return {
    ...(tabsCache ?? defaultTabsData()),
    ...loadSettings(),
  };
}

export function saveState(next: AppState): Promise<void> {
  tabsCache = {
    tabs: next.tabs,
    activeId: next.activeId,
    counter: next.counter,
    wrapWidth: next.wrapWidth,
  };
  saveSettings({
    accentColor: next.accentColor,
    textColor: next.textColor,
    fontFamily: next.fontFamily,
    letterSpacing: next.letterSpacing,
    contentPosition: next.contentPosition,
  });
  return enqueueWrite(() => idbPut(TABS_KEY, tabsCache));
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

function normalizeTablesState(value: unknown): TablesState | null {
  if (!isValidTablesState(value)) {
    return null;
  }
  const state = value as TablesState;
  return {
    ...state,
    tables: state.tables.map((table) => ({
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
  return tablesCache ?? defaultTablesState();
}

export function saveTablesState(next: TablesState): Promise<void> {
  tablesCache = next;
  return enqueueWrite(() => idbPut(TABLES_KEY, next));
}

export function loadWrapPreference(): boolean {
  return wrapCache ?? false;
}

export function saveWrapPreference(enabled: boolean): Promise<void> {
  wrapCache = enabled;
  return enqueueWrite(() => idbPut(WRAP_KEY, enabled));
}

export type BackupData = {
  app: AppState;
  tables: TablesState;
  wrap: boolean;
};

export function buildBackup(): BackupData {
  return {
    app: initialState(),
    tables: initialTablesState(),
    wrap: loadWrapPreference(),
  };
}

export function isValidBackup(value: unknown): boolean {
  if (isValidState(value)) {
    return true;
  }
  if (!value || typeof value !== "object") {
    return false;
  }
  const backup = value as Record<string, unknown>;
  return (
    isValidState(backup.app) &&
    isValidTablesState(backup.tables) &&
    typeof backup.wrap === "boolean"
  );
}

export function importBackup(value: unknown): AppState | null {
  if (isValidState(value)) {
    saveState(value);
    return value;
  }
  if (!isValidBackup(value)) {
    return null;
  }
  const backup = value as BackupData;
  saveState(backup.app);
  const tables = normalizeTablesState(backup.tables);
  if (tables) {
    saveTablesState(tables);
  }
  saveWrapPreference(backup.wrap);
  return backup.app;
}

export async function initStorage() {
  await writeQueue;
  const [tabs, tables, wrap] = await Promise.all([
    idbGet(TABS_KEY),
    idbGet(TABLES_KEY),
    idbGet(WRAP_KEY),
  ]);
  tabsCache = isValidTabsData(tabs) ? tabs : null;
  tablesCache = normalizeTablesState(tables);
  wrapCache = typeof wrap === "boolean" ? wrap : null;
}

export async function clearAllData() {
  tabsCache = null;
  tablesCache = null;
  wrapCache = null;
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch {}
  await enqueueWrite(idbClear);
}

export type { TableTab };
