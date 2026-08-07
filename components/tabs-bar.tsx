"use client";

import { useEffect, useRef, useState } from "react";
import IconClose from "./icons/close";
import IconPlus from "./icons/plus";
import IconSettings from "./icons/settings";

type Tab = {
  id: number;
  content: string;
};

type AppState = {
  tabs: Tab[];
  activeId: number;
  counter: number;
  wrapWidth: number | null;
};

const STORAGE_KEY = "duhlupa-tabs";

function saveState(next: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

function defaultState(): AppState {
  return { tabs: [{ id: 1, content: "" }], activeId: 1, counter: 1, wrapWidth: null };
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

export default function TabsBar() {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  const { tabs, activeId, counter, wrapWidth } = state;
  const activeTab = tabs.find((tab) => tab.id === activeId);
  const stripRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const dragHandle = useRef<{
    startX: number;
    startWidth: number;
    edge: "left" | "right";
  } | null>(null);
  const [wrapperW, setWrapperW] = useState(0);

  useEffect(() => {
    setState(initialState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    function measure() {
      if (wrapperRef.current) {
        setWrapperW(wrapperRef.current.clientWidth);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [ready]);

  useEffect(() => {
    function onMove(event: MouseEvent) {
      const handle = dragHandle.current;
      if (!handle) {
        return;
      }
      const delta = event.clientX - handle.startX;
      const width =
        handle.startWidth + (handle.edge === "right" ? delta : -delta);
      const next = {
        ...state,
        wrapWidth: Math.min(Math.max(width, 320), wrapperW),
      };
      setState(next);
      saveState(next);
    }
    function onUp() {
      dragHandle.current = null;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [wrapperW]);

  function onHandlePointerDown(edge: "left" | "right") {
    return (event: React.PointerEvent) => {
      event.preventDefault();
      dragHandle.current = {
        startX: event.clientX,
        startWidth: wrapWidth ?? wrapperW,
        edge,
      };
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {}
    };
  }

  function onHandlePointerMove(event: React.PointerEvent) {
    const handle = dragHandle.current;
    if (!handle) {
      return;
    }
    const delta = event.clientX - handle.startX;
    const width =
      handle.startWidth + (handle.edge === "right" ? delta : -delta);
    const next = {
      ...state,
      wrapWidth: Math.min(Math.max(width, 320), wrapperW),
    };
    setState(next);
    saveState(next);
  }

  function onHandlePointerUp() {
    dragHandle.current = null;
  }

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

  if (!ready) {
    return <main className="h-dvh bg-surface" />;
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
          const title =
            firstLine ||
            (tab.id === 1 ? "Untitled" : `Untitled ${tab.id}`);
          const borderClasses = `${index > 0 ? "border-l" : ""} ${
            index === tabs.length - 1 ? "border-r" : ""
          }`;
          return (
            <div
              key={tab.id}
              onClick={() => {
                if (!drag.current.moved) {
                  selectTab(tab.id);
                }
              }}
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
          className="flex h-full shrink-0 cursor-pointer items-center bg-tab-bar px-3 text-muted transition hover:bg-tab-active hover:text-foreground"
        >
          <IconPlus size={16} />
        </button>
      </div>
      <div
        ref={wrapperRef}
        onClick={() => editorRef.current?.focus()}
        className="group editor-scroll relative min-h-0 flex-1 overflow-y-auto bg-card"
      >
        <div
          className="relative mx-auto min-h-full"
          style={{
            width: wrapWidth ? `${wrapWidth}px` : "100%",
            maxWidth: "100%",
          }}
        >
          <textarea
            ref={editorRef}
            spellCheck={false}
            placeholder="Start writing..."
            aria-label="Note content"
            value={activeTab?.content ?? ""}
            onChange={(event) => updateContent(event.target.value)}
            style={{ fieldSizing: "content" }}
            className="w-full resize-none bg-transparent px-3 pb-16 pt-6 font-mono text-sm leading-4 text-foreground caret-accent outline-none placeholder:text-muted sm:px-6 sm:pb-20 sm:pt-8 sm:text-base sm:leading-5 md:px-10 lg:px-14"
          />
          <div
            onPointerDown={onHandlePointerDown("left")}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
            className="absolute inset-y-0 -ml-3 left-0 hidden w-6 cursor-col-resize touch-none items-center justify-center opacity-0 transition-opacity hover:opacity-100 sm:flex sm:left-3 md:left-7 lg:left-11"
          >
            <div className="h-full w-px bg-edge" />
          </div>
          <div
            onPointerDown={onHandlePointerDown("right")}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
            className="absolute inset-y-0 -mr-3 right-0 hidden w-6 cursor-col-resize touch-none items-center justify-center opacity-0 transition-opacity hover:opacity-100 sm:flex sm:right-3 md:right-7 lg:right-11"
          >
            <div className="h-full w-px bg-edge" />
          </div>
        </div>
      </div>
      <button
        aria-label="Settings"
        className="group absolute bottom-2 left-0 flex h-8 cursor-pointer items-center overflow-hidden rounded-r-md bg-accent text-base transition-colors hover:brightness-110"
      >
        <span className="flex h-full w-8 shrink-0 items-center justify-center">
          <IconSettings />
        </span>
        <span className="max-w-0 self-center whitespace-nowrap pt-0.5 font-mono text-xs text-base opacity-0 transition-all duration-200 group-hover:max-w-40 group-hover:opacity-100 group-hover:pr-3">
          Settings
        </span>
      </button>
    </main>
  );
}
