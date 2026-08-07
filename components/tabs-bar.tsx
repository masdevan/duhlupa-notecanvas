"use client";

import { useEffect, useState } from "react";
import Editor from "./editor";
import SettingsButton from "./settings-button";
import SettingsModal from "./settings-modal";
import TabStrip from "./tab-strip";
import { defaultState, initialState, saveState } from "../lib/storage";
import type { AppState } from "../lib/types";

const DEFAULT_ACCENT = "#39bff3";
const DEFAULT_TEXT = "#f5f5f5";

function applyColors(accent: string, text: string) {
  document.documentElement.style.setProperty("--color-accent", accent);
  document.documentElement.style.setProperty("--color-foreground", text);
}

export default function TabsBar() {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { tabs, activeId, wrapWidth, accentColor, textColor } = state;
  const activeTab = tabs.find((tab) => tab.id === activeId);

  useEffect(() => {
    const next = initialState();
    applyColors(next.accentColor, next.textColor);
    setState(next);
    setReady(true);
  }, []);

  function commit(next: AppState) {
    setState(next);
    saveState(next);
  }

  function addTab() {
    const id = state.counter + 1;
    commit({
      ...state,
      tabs: [...state.tabs, { id, content: "" }],
      activeId: id,
      counter: id,
    });
  }

  function closeTab(id: number) {
    const index = state.tabs.findIndex((tab) => tab.id === id);
    const remaining = state.tabs.filter((tab) => tab.id !== id);
    if (remaining.length === 0) {
      commit(defaultState());
      return;
    }
    commit({
      ...state,
      tabs: remaining,
      activeId:
        state.activeId === id
          ? remaining[Math.min(index, remaining.length - 1)].id
          : state.activeId,
    });
  }

  function updateContent(content: string) {
    commit({
      ...state,
      tabs: state.tabs.map((tab) =>
        tab.id === state.activeId ? { ...tab, content } : tab,
      ),
    });
  }

  function selectTab(id: number) {
    commit({ ...state, activeId: id });
  }

  function updateWrapWidth(width: number) {
    commit({ ...state, wrapWidth: width });
  }

  function updateColors(accent: string, text: string) {
    applyColors(accent, text);
    commit({ ...state, accentColor: accent, textColor: text });
  }

  function resetAllSettings() {
    applyColors(DEFAULT_ACCENT, DEFAULT_TEXT);
    commit({
      ...state,
      accentColor: DEFAULT_ACCENT,
      textColor: DEFAULT_TEXT,
      wrapWidth: null,
    });
  }

  function clearAllData() {
    try {
      localStorage.removeItem("duhlupa-tabs");
    } catch {}
    applyColors(DEFAULT_ACCENT, DEFAULT_TEXT);
    setState(defaultState());
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "duhlupa-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importData(data: AppState) {
    applyColors(data.accentColor, data.textColor);
    setState(data);
    saveState(data);
  }

  if (!ready) {
    return <main className="h-dvh bg-surface" />;
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <h1 className="sr-only">duhlupa</h1>
      <TabStrip
        tabs={tabs}
        activeId={activeId}
        onSelect={selectTab}
        onAdd={addTab}
        onClose={closeTab}
      />
      <Editor
        content={activeTab?.content ?? ""}
        wrapWidth={wrapWidth}
        onChange={updateContent}
        onWrapWidthChange={updateWrapWidth}
      />
      <SettingsButton onOpen={() => setSettingsOpen(true)} />
      {settingsOpen && (
        <SettingsModal
          accentColor={accentColor}
          textColor={textColor}
          onSaveColors={updateColors}
          onResetAll={resetAllSettings}
          onClearAll={clearAllData}
          onExport={exportData}
          onImport={importData}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </main>
  );
}
