import type {
  AppState,
  GalleryImage,
  GalleryManifest,
  GalleryState,
  Tab,
  TablesState,
  TableTab,
} from "./types";

const SETTINGS_KEY = "duhlupa-settings";
const DB_NAME = "duhlupa";
const STORE = "kv";
const TABS_KEY = "tabs";
const TABLES_KEY = "tables";
const WRAP_KEY = "wrap";
const IMAGES_KEY = "images";
const IMAGE_PREFIX = "image:";

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
let galleryCache: GalleryManifest | null = null;
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

async function idbDelete(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGetMany(keys: string[]): Promise<unknown[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const store = db.transaction(STORE, "readonly").objectStore(STORE);
    const values = keys.map(
      (key) =>
        new Promise<unknown>((resolveOne, rejectOne) => {
          const request = store.get(key);
          request.onsuccess = () => resolveOne(request.result?.value);
          request.onerror = () => rejectOne(request.error);
        }),
    );
    Promise.all(values).then(resolve, reject);
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

function isValidGalleryState(value: unknown): value is GalleryState {
  if (!value || typeof value !== "object") {
    return false;
  }
  const s = value as Record<string, unknown>;
  return (
    Array.isArray(s.images) &&
    s.images.every(
      (image) =>
        typeof image === "object" &&
        image !== null &&
        typeof (image as GalleryState["images"][number]).id === "number" &&
        typeof (image as GalleryState["images"][number]).dataUrl === "string",
    ) &&
    typeof s.counter === "number"
  );
}

function isValidManifest(value: unknown): value is GalleryManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const s = value as Record<string, unknown>;
  return (
    Array.isArray(s.ids) &&
    s.ids.every((id) => typeof id === "number") &&
    typeof s.counter === "number"
  );
}

function imageKey(id: number) {
  return `${IMAGE_PREFIX}${id}`;
}

export function defaultGalleryManifest(): GalleryManifest {
  return { ids: [], counter: 0 };
}

export function initialGalleryManifest(): GalleryManifest {
  return galleryCache ?? defaultGalleryManifest();
}

export function countGalleryImages(): number {
  return initialGalleryManifest().ids.length;
}

export async function loadGalleryImages(ids: number[]): Promise<GalleryImage[]> {
  if (ids.length === 0) {
    return [];
  }
  const values = await idbGetMany(ids.map(imageKey));
  return values.filter((value): value is GalleryImage => isValidImage(value));
}

function isValidImage(value: unknown): value is GalleryImage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === "number" &&
    typeof s.dataUrl === "string" &&
    typeof s.name === "string" &&
    typeof s.type === "string"
  );
}

export async function loadAllGalleryImages(): Promise<GalleryImage[]> {
  return loadGalleryImages(initialGalleryManifest().ids);
}

export function saveGalleryImages(
  added: GalleryImage[],
  removedIds: number[] = [],
  counter?: number,
): Promise<void> {
  const current = initialGalleryManifest();
  const removed = new Set(removedIds);
  const kept = current.ids.filter((id) => !removed.has(id));
  const ids = [...added.map((image) => image.id), ...kept];
  const next: GalleryManifest = {
    ids,
    counter: Math.max(counter ?? 0, current.counter, ...ids, 0),
  };
  galleryCache = next;
  return enqueueWrite(async () => {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      for (const image of added) {
        store.put({ key: imageKey(image.id), value: image });
      }
      for (const id of removed) {
        store.delete(imageKey(id));
      }
      store.put({ key: IMAGES_KEY, value: next });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

export function removeGalleryImages(ids: number[]): Promise<void> {
  return saveGalleryImages([], ids);
}

export function clearGalleryImages(): Promise<void> {
  const stale = initialGalleryManifest().ids;
  galleryCache = defaultGalleryManifest();
  return enqueueWrite(async () => {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      for (const id of stale) {
        store.delete(imageKey(id));
      }
      store.put({ key: IMAGES_KEY, value: galleryCache });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
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
  images?: GalleryState;
};

export async function buildBackup(): Promise<BackupData> {
  return {
    app: initialState(),
    tables: initialTablesState(),
    wrap: loadWrapPreference(),
    images: {
      images: await loadAllGalleryImages(),
      counter: initialGalleryManifest().counter,
    },
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
    typeof backup.wrap === "boolean" &&
    (backup.images === undefined || isValidGalleryState(backup.images))
  );
}

export async function importBackup(value: unknown): Promise<AppState | null> {
  if (isValidState(value)) {
    await saveState(value);
    return value;
  }
  if (!isValidBackup(value)) {
    return null;
  }
  const backup = value as BackupData;
  await saveState(backup.app);
  const tables = normalizeTablesState(backup.tables);
  if (tables) {
    await saveTablesState(tables);
  }
  await saveWrapPreference(backup.wrap);
  if (isValidGalleryState(backup.images)) {
    await saveGalleryImages(backup.images.images, [], backup.images.counter);
  }
  return backup.app;
}

export async function initStorage() {
  await writeQueue;
  const [tabs, tables, wrap, images] = await Promise.all([
    idbGet(TABS_KEY),
    idbGet(TABLES_KEY),
    idbGet(WRAP_KEY),
    idbGet(IMAGES_KEY),
  ]);
  tabsCache = isValidTabsData(tabs) ? tabs : null;
  tablesCache = normalizeTablesState(tables);
  wrapCache = typeof wrap === "boolean" ? wrap : null;
  if (isValidManifest(images)) {
    galleryCache = images;
    return;
  }
  if (isValidGalleryState(images)) {
    await migrateLegacyGallery(images);
    return;
  }
  galleryCache = null;
}

async function migrateLegacyGallery(legacy: GalleryState): Promise<void> {
  galleryCache = null;
  await saveGalleryImages(legacy.images, [], legacy.counter);
}

export async function clearAllData() {
  tabsCache = null;
  tablesCache = null;
  galleryCache = null;
  wrapCache = null;
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch {}
  await enqueueWrite(idbClear);
}

export type { TableTab };
