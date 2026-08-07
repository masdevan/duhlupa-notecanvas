"use client";

import { useEffect, useState } from "react";
import Editor from "./editor";
import SettingsButton from "./settings-button";
import TabStrip from "./tab-strip";
import { defaultState, initialState, saveState } from "../lib/storage";
import type { AppState } from "../lib/types";

export default function TabsBar() {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  const { tabs, activeId, wrapWidth } = state;
  const activeTab = tabs.find((tab) => tab.id === activeId);

  useEffect(() => {
    setState(initialState());
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
      <SettingsButton />
    </main>
  );
}
