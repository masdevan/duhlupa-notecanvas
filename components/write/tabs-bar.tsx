"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "../confirm-dialog";
import Settings from "../settings";
import Sidebar from "../sidebar";
import TabStrip from "../tab-strip";
import Editor from "./editor";
import {
  defaultState,
  initialState,
  initStorage,
  saveState,
} from "../../lib/storage";
import { getTabTitle } from "../../lib/tab-title";
import type { AppState, Tab } from "../../lib/types";

export default function TabsBar() {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  const [pendingCloseId, setPendingCloseId] = useState<number | null>(null);
  const { tabs, activeId, wrapWidth } = state;
  const activeTab = tabs.find((tab) => tab.id === activeId);
  const pendingTab = tabs.find((tab) => tab.id === pendingCloseId);

  useEffect(() => {
    initStorage().then(() => {
      setState(initialState());
      setReady(true);
    });
  }, []);

  useEffect(() => {
    function reload() {
      setPendingCloseId(null);
      initStorage().then(() => setState(initialState()));
    }
    window.addEventListener("duhlupa-data-changed", reload);
    return () => window.removeEventListener("duhlupa-data-changed", reload);
  }, []);

  useEffect(() => {
    if (pendingCloseId === null) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPendingCloseId(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pendingCloseId]);

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
      commit({
        ...state,
        tabs: [{ id: 1, content: "" }],
        activeId: 1,
        counter: 1,
      });
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

  function confirmCloseTab() {
    if (pendingCloseId === null) {
      return;
    }
    closeTab(pendingCloseId);
    setPendingCloseId(null);
  }

  function reorderTabs(orderedIds: number[]) {
    const tabsById = new Map(state.tabs.map((tab) => [tab.id, tab]));
    const orderedTabs = orderedIds
      .map((id) => tabsById.get(id))
      .filter((tab): tab is Tab => Boolean(tab));
    if (orderedTabs.length !== state.tabs.length) {
      return;
    }
    commit({ ...state, tabs: orderedTabs });
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
    <main className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <h1 className="sr-only text-right">Duhlupa</h1>
        <TabStrip
          tabs={tabs}
          activeId={activeId}
          onSelect={selectTab}
          onAdd={addTab}
          onClose={setPendingCloseId}
          reorderable
          onReorder={reorderTabs}
        />
        <Editor
          content={activeTab?.content ?? ""}
          wrapWidth={wrapWidth}
          onChange={updateContent}
          onWrapWidthChange={updateWrapWidth}
        />
        <Settings />
      </div>
      {pendingTab && (
        <ConfirmDialog
          message={`Delete "${getTabTitle(pendingTab)}"?`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          danger
          onConfirm={confirmCloseTab}
          onCancel={() => setPendingCloseId(null)}
        />
      )}
    </main>
  );
}
