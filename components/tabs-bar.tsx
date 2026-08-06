"use client";

import { useEffect, useState } from "react";
import IconClose from "./icons/close";
import IconPlus from "./icons/plus";

type Tab = {
  id: number;
  content: string;
};

type AppState = {
  tabs: Tab[];
  activeId: number;
  counter: number;
};

const STORAGE_KEY = "duhlupa-tabs";

function saveState(next: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

function defaultState(): AppState {
  return { tabs: [{ id: 1, content: "" }], activeId: 1, counter: 1 };
}

function initialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : null;
    if (
      stored &&
      Array.isArray(stored.tabs) &&
      stored.tabs.length > 0 &&
      typeof stored.activeId === "number" &&
      typeof stored.counter === "number"
    ) {
      return stored;
    }
  } catch {
    return defaultState();
  }
  return defaultState();
}

export default function TabsBar() {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  const { tabs, activeId, counter } = state;
  const activeTab = tabs.find((tab) => tab.id === activeId);

  useEffect(() => {
    setState(initialState());
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  function addTab() {
    const id = counter + 1;
    const next = {
      ...state,
      tabs: [...state.tabs, { id, content: "" }],
      activeId: id,
      counter: id,
    };
    setState(next);
    saveState(next);
  }

  function closeTab(id: number) {
    const index = state.tabs.findIndex((tab) => tab.id === id);
    const remaining = state.tabs.filter((tab) => tab.id !== id);
    let next: AppState;
    if (remaining.length === 0) {
      next = defaultState();
    } else {
      next = {
        ...state,
        tabs: remaining,
        activeId:
          state.activeId === id
            ? remaining[Math.min(index, remaining.length - 1)].id
            : state.activeId,
      };
    }
    setState(next);
    saveState(next);
  }

  function updateContent(content: string) {
    const next = {
      ...state,
      tabs: state.tabs.map((tab) =>
        tab.id === state.activeId ? { ...tab, content } : tab,
      ),
    };
    setState(next);
    saveState(next);
  }

  function selectTab(id: number) {
    const next = { ...state, activeId: id };
    setState(next);
    saveState(next);
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <h1 className="sr-only">duhlupa</h1>
      <div className="no-scrollbar flex h-9 select-none items-stretch gap-px overflow-x-auto overscroll-x-contain bg-tab-bar">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeId;
          const firstLine = tab.content.split("\n")[0].trim();
          const title =
            firstLine ||
            (tab.id === 1 ? "Untitled" : `Untitled ${tab.id}`);
          const borderClasses = `${index > 0 ? "border-l" : ""} ${
            index === tabs.length - 1 ? "border-r" : ""
          }`;
          return (
            <div
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={`group relative flex h-full w-40 shrink-0 cursor-pointer items-center whitespace-nowrap border-t-2 border-edge pl-4 font-mono text-xs transition-colors ${borderClasses} ${
                isActive
                  ? "border-t-accent bg-tab-active text-muted"
                  : "border-t-transparent text-muted hover:bg-tab-active/50 hover:text-foreground"
              }`}
            >
              <span className="truncate pr-7">{title}</span>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  closeTab(tab.id);
                }}
                aria-label="Close tab"
                className="absolute right-2 flex h-3 w-3 cursor-pointer items-center justify-center rounded-full bg-red-500/20 text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/40"
              >
                <IconClose size={10} />
              </button>
            </div>
          );
        })}
        <button
          onClick={addTab}
          aria-label="New tab"
          className="sticky right-0 flex h-full shrink-0 cursor-pointer items-center bg-tab-bar px-3 text-muted transition hover:bg-tab-active hover:text-foreground"
        >
          <IconPlus size={16} />
        </button>
      </div>
      <textarea
        spellCheck={false}
        placeholder="Start writing..."
        aria-label="Note content"
        value={activeTab?.content ?? ""}
        onChange={(event) => updateContent(event.target.value)}
        className="min-h-0 flex-1 resize-none bg-card px-4 py-3 font-mono text-sm leading-4 text-foreground caret-accent outline-none placeholder:text-muted sm:px-6 sm:py-4 sm:text-base sm:leading-5 md:px-10"
      />
    </main>
  );
}
