import { beforeEach, describe, expect, it } from "vitest";
import {
  buildBackup,
  clearAllData,
  clearGalleryImages,
  countGalleryImages,
  defaultGalleryManifest,
  defaultState,
  defaultTablesState,
  importBackup,
  initStorage,
  initialGalleryManifest,
  initialState,
  initialTablesState,
  isValidBackup,
  isValidState,
  loadGalleryImages,
  loadWrapPreference,
  removeGalleryImages,
  saveGalleryImages,
  saveState,
  saveTablesState,
  saveWrapPreference,
} from "../../lib/storage";
import type { AppState } from "../../lib/types";

function putRaw(key: string, value: unknown) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open("duhlupa", 1);
    request.onsuccess = () => {
      const tx = request.result.transaction("kv", "readwrite");
      tx.objectStore("kv").put({ key, value });
      tx.oncomplete = () => {
        request.result.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}

function readRaw(key: string) {
  return new Promise<unknown>((resolve, reject) => {
    const request = indexedDB.open("duhlupa", 1);
    request.onsuccess = () => {
      const tx = request.result.transaction("kv", "readonly");
      const get = tx.objectStore("kv").get(key);
      get.onsuccess = () => {
        request.result.close();
        resolve(get.result?.value);
      };
      get.onerror = () => reject(get.error);
    };
    request.onerror = () => reject(request.error);
  });
}

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

describe("indexeddb storage", () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it("falls back to defaults when storage is empty", async () => {
    await initStorage();
    expect(initialState()).toEqual(defaultState());
    expect(initialTablesState()).toEqual(defaultTablesState());
    expect(loadWrapPreference()).toBe(false);
  });

  it("persists and reloads tabs state", async () => {
    const state: AppState = {
      ...defaultState(),
      tabs: [
        { id: 1, content: "hello" },
        { id: 2, content: "world" },
      ],
      activeId: 2,
      counter: 2,
    };
    await saveState(state);
    await initStorage();
    expect(initialState().tabs).toEqual(state.tabs);
    expect(initialState().activeId).toBe(2);
  });

  it("persists settings fields to localStorage", async () => {
    await saveState({ ...defaultState(), accentColor: "#ff0000" });
    const settings = JSON.parse(localStorage.getItem("duhlupa-settings")!);
    expect(settings.accentColor).toBe("#ff0000");
  });

  it("merges settings from localStorage with tabs from indexeddb", async () => {
    await saveState({ ...defaultState(), tabs: [{ id: 1, content: "note" }] });
    localStorage.setItem(
      "duhlupa-settings",
      JSON.stringify({
        accentColor: "#123456",
        textColor: "#f5f5f5",
        fontFamily: "mono",
        letterSpacing: -0.5,
        contentPosition: "right",
      }),
    );
    await initStorage();
    expect(initialState().accentColor).toBe("#123456");
    expect(initialState().contentPosition).toBe("right");
    expect(initialState().tabs[0].content).toBe("note");
  });

  it("persists tables state", async () => {
    await saveTablesState({
      tables: [
        { id: 1, name: "Sales", columns: ["A"], colWidths: [300], rows: [["x"]] },
      ],
      activeId: 1,
      counter: 1,
    });
    await initStorage();
    expect(initialTablesState().tables[0].name).toBe("Sales");
  });

  it("normalizes legacy tables missing name and colWidths", async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("duhlupa", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put({
        key: "tables",
        value: {
          tables: [{ id: 1, columns: ["A"], rows: [["x"]] }],
          activeId: 1,
          counter: 1,
        },
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await initStorage();
    const state = initialTablesState();
    expect(state.tables[0].name).toBe("A");
    expect(state.tables[0].colWidths).toEqual([200]);
  });

  it("persists gallery images one record per image", async () => {
    await saveGalleryImages([
      { id: 1, name: "shot.png", type: "image/png", dataUrl: "data:AAA" },
      { id: 2, name: "two.png", type: "image/png", dataUrl: "data:BBB" },
    ]);
    await initStorage();
    expect(initialGalleryManifest().ids).toEqual([1, 2]);
    expect(countGalleryImages()).toBe(2);
    const loaded = await loadGalleryImages([1, 2]);
    expect(loaded.map((image) => image.dataUrl)).toEqual([
      "data:AAA",
      "data:BBB",
    ]);
  });

  it("loads only the requested page of images", async () => {
    await saveGalleryImages([
      { id: 1, name: "a.png", type: "image/png", dataUrl: "data:A" },
      { id: 2, name: "b.png", type: "image/png", dataUrl: "data:B" },
      { id: 3, name: "c.png", type: "image/png", dataUrl: "data:C" },
    ]);
    await initStorage();
    const firstPage = await loadGalleryImages([1]);
    expect(firstPage).toHaveLength(1);
    expect(firstPage[0].id).toBe(1);
  });

  it("removes an image and updates the manifest", async () => {
    await saveGalleryImages([
      { id: 1, name: "a.png", type: "image/png", dataUrl: "data:A" },
      { id: 2, name: "b.png", type: "image/png", dataUrl: "data:B" },
    ]);
    await removeGalleryImages([1]);
    await initStorage();
    expect(initialGalleryManifest().ids).toEqual([2]);
    expect(await loadGalleryImages([1])).toHaveLength(0);
    expect(await loadGalleryImages([2])).toHaveLength(1);
  });

  it("clears every image", async () => {
    await saveGalleryImages([
      { id: 1, name: "a.png", type: "image/png", dataUrl: "data:A" },
      { id: 2, name: "b.png", type: "image/png", dataUrl: "data:B" },
    ]);
    await clearGalleryImages();
    await initStorage();
    expect(initialGalleryManifest()).toEqual(defaultGalleryManifest());
    expect(await loadGalleryImages([1, 2])).toHaveLength(0);
  });

  it("migrates a legacy single record gallery", async () => {
    await putRaw("images", {
      images: [
        { id: 7, name: "old.png", type: "image/png", dataUrl: "data:OLD" },
      ],
      counter: 7,
    });
    await initStorage();
    expect(initialGalleryManifest().ids).toEqual([7]);
    const loaded = await loadGalleryImages([7]);
    expect(loaded[0].dataUrl).toBe("data:OLD");
    expect(await readRaw("images")).toEqual({ ids: [7], counter: 7 });
  });

  it("falls back to an empty gallery", async () => {
    await initStorage();
    expect(initialGalleryManifest()).toEqual(defaultGalleryManifest());
    expect(countGalleryImages()).toBe(0);
  });

  it("persists the wrap preference", async () => {
    await saveWrapPreference(true);
    await initStorage();
    expect(loadWrapPreference()).toBe(true);
  });

  it("clearAllData resets everything", async () => {
    await saveState({ ...defaultState(), tabs: [{ id: 1, content: "x" }] });
    await saveGalleryImages([
      { id: 1, name: "a.png", type: "image/png", dataUrl: "data:A" },
    ]);
    await clearAllData();
    await initStorage();
    expect(initialState()).toEqual(defaultState());
    expect(initialTablesState()).toEqual(defaultTablesState());
    expect(initialGalleryManifest()).toEqual(defaultGalleryManifest());
    expect(await loadGalleryImages([1])).toHaveLength(0);
  });
});

describe("backup", () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it("builds a backup containing tabs, tables, and wrap", async () => {
    await saveState({ ...defaultState(), tabs: [{ id: 1, content: "note" }] });
    await saveTablesState({
      tables: [
        { id: 1, name: "Sales", columns: ["A"], colWidths: [200], rows: [["1"]] },
      ],
      activeId: 1,
      counter: 1,
    });
    await saveGalleryImages([
      { id: 1, name: "a.png", type: "image/png", dataUrl: "data:A" },
    ]);
    await saveWrapPreference(true);
    const backup = await buildBackup();
    expect(backup.app.tabs[0].content).toBe("note");
    expect(backup.tables.tables[0].name).toBe("Sales");
    expect(backup.wrap).toBe(true);
    expect(backup.images?.images).toHaveLength(1);
    expect(backup.images?.images[0].dataUrl).toBe("data:A");
  });

  it("restores everything from a backup", async () => {
    const backup = {
      app: { ...defaultState(), tabs: [{ id: 1, content: "restored" }] },
      tables: {
        tables: [
          { id: 1, name: "Stock", columns: ["B"], colWidths: [250], rows: [["2"]] },
        ],
        activeId: 1,
        counter: 1,
      },
      wrap: true,
      images: {
        images: [{ id: 1, name: "b.png", type: "image/png", dataUrl: "data:," }],
        counter: 1,
      },
    };
    expect(isValidBackup(backup)).toBe(true);
    expect(await importBackup(backup)).toEqual(backup.app);
    await initStorage();
    expect(initialState().tabs[0].content).toBe("restored");
    expect(initialTablesState().tables[0].name).toBe("Stock");
    expect(loadWrapPreference()).toBe(true);
    expect(initialGalleryManifest().ids).toEqual([1]);
    expect((await loadGalleryImages([1]))[0].name).toBe("b.png");
  });

  it("accepts backups without an images key", () => {
    const legacy = {
      app: defaultState(),
      tables: defaultTablesState(),
      wrap: false,
    };
    expect(isValidBackup(legacy)).toBe(true);
  });

  it("accepts legacy plain AppState backups", async () => {
    const legacy = { ...defaultState(), tabs: [{ id: 1, content: "old" }] };
    expect(isValidBackup(legacy)).toBe(true);
    await importBackup(legacy);
    await initStorage();
    expect(initialState().tabs[0].content).toBe("old");
  });

  it("rejects invalid backups", async () => {
    expect(isValidBackup(null)).toBe(false);
    expect(isValidBackup({ app: {}, tables: {}, wrap: "yes" })).toBe(false);
    expect(await importBackup({ nope: true })).toBeNull();
  });

  it("rejects backups with a malformed images key", () => {
    const bad = {
      app: defaultState(),
      tables: defaultTablesState(),
      wrap: false,
      images: { images: [{ id: "x", dataUrl: 1 }], counter: 1 },
    };
    expect(isValidBackup(bad)).toBe(false);
  });
});
