"use client";

import { useState } from "react";
import IconClose from "./icons/close";
import IconPlus from "./icons/plus";

type Tab = {
  id: number;
  content: string;
};

export default function TabsBar() {
  const [tabs, setTabs] = useState<Tab[]>([{ id: 1, content: "" }]);
  const [activeId, setActiveId] = useState(1);
  const [counter, setCounter] = useState(1);

  const activeTab = tabs.find((tab) => tab.id === activeId);

  function addTab() {
    const id = counter + 1;
    setTabs([...tabs, { id, content: "" }]);
    setCounter(id);
    setActiveId(id);
  }

  function closeTab(id: number) {
    const index = tabs.findIndex((tab) => tab.id === id);
    const remaining = tabs.filter((tab) => tab.id !== id);
    setTabs(remaining);
    if (activeId === id) {
      setActiveId(remaining[Math.min(index, remaining.length - 1)]?.id ?? 0);
    }
  }

  function updateContent(content: string) {
    setTabs(tabs.map((tab) => (tab.id === activeId ? { ...tab, content } : tab)));
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
              onClick={() => setActiveId(tab.id)}
              className={`group relative flex h-full w-40 shrink-0 cursor-pointer items-center whitespace-nowrap border-t-2 border-edge pl-4 text-xs transition-colors ${borderClasses} ${
                isActive
                  ? "border-t-accent bg-tab-active text-foreground"
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
        className="min-h-0 flex-1 resize-none bg-card px-4 py-4 font-mono text-sm leading-6 text-foreground caret-accent outline-none placeholder:text-muted sm:px-6 sm:py-6 sm:text-base sm:leading-7 md:px-10"
      />
    </main>
  );
}
