"use client";

import { useRef } from "react";
import type { Tab } from "../lib/types";
import IconClose from "./icons/close";
import IconPlus from "./icons/plus";

type TabStripProps = {
  tabs: Tab[];
  activeId: number;
  onSelect: (id: number) => void;
  onAdd: () => void;
  onClose: (id: number) => void;
};

export default function TabStrip({
  tabs,
  activeId,
  onSelect,
  onAdd,
  onClose,
}: TabStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  function onMouseDown(event: React.MouseEvent) {
    drag.current = {
      active: true,
      startX: event.clientX,
      startScroll: stripRef.current?.scrollLeft ?? 0,
      moved: false,
    };
    stripRef.current?.classList.add("cursor-grabbing");
  }

  function onMouseMove(event: React.MouseEvent) {
    if (!drag.current.active) {
      return;
    }
    const dx = event.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) {
      drag.current.moved = true;
    }
    if (stripRef.current) {
      stripRef.current.scrollLeft = drag.current.startScroll - dx;
    }
  }

  function onMouseUp() {
    drag.current.active = false;
    stripRef.current?.classList.remove("cursor-grabbing");
  }

  return (
    <div
      ref={stripRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      className="no-scrollbar flex h-10 cursor-grab select-none items-stretch gap-px overflow-x-auto overscroll-x-contain bg-tab-bar sm:h-9"
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeId;
        const firstLine = tab.content.split("\n")[0].trim();
        const title = firstLine || (tab.id === 1 ? "Untitled" : `Untitled ${tab.id}`);
        const borderClasses = `${index > 0 ? "border-l" : ""} ${
          index === tabs.length - 1 ? "border-r" : ""
        }`;
        return (
          <div
            key={tab.id}
            onClick={() => {
              if (!drag.current.moved) {
                onSelect(tab.id);
              }
            }}
              className={`group relative flex h-full w-40 shrink-0 cursor-pointer items-center whitespace-nowrap border-t-2 border-edge pl-4 font-mono text-xs transition-colors ${borderClasses} ${
                isActive
                  ? "border-t-accent bg-tab-active text-foreground/20"
                  : "border-t-transparent text-foreground/10 hover:bg-tab-active/50 hover:text-foreground"
              }`}
          >
            <span className="truncate pr-7">{title}</span>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onClose(tab.id);
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
        onClick={onAdd}
        aria-label="New tab"
        className="flex h-full shrink-0 cursor-pointer items-center bg-tab-bar px-3 text-muted transition hover:bg-tab-active hover:text-foreground"
      >
        <IconPlus size={16} />
      </button>
    </div>
  );
}
