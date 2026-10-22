"use client";

import { useEffect, useRef, useState } from "react";
import { getTabTitle } from "../lib/tab-title";
import type { Tab } from "../lib/types";
import IconClose from "./icons/close";
import IconPlus from "./icons/plus";

const DRAG_THRESHOLD = 8;
const EDGE_SCROLL_ZONE = 32;
const EDGE_SCROLL_SPEED = 12;
const TAB_GAP = 1;
const SHIFT_TRANSITION = "transform 140ms ease";

type TabStripProps = {
  tabs: Tab[];
  activeId: number;
  onSelect: (id: number) => void;
  onAdd: () => void;
  onClose: (id: number) => void;
  showAdd?: boolean;
  editingId?: number | null;
  editValue?: string;
  onEditChange?: (value: string) => void;
  onEditCommit?: () => void;
  onRename?: (id: number) => void;
  reorderable?: boolean;
  onReorder?: (orderedIds: number[]) => void;
};

type DragMode = "scroll" | "reorder";

type DragState = {
  pointerId: number;
  mode: DragMode;
  tabId: number | null;
  originIndex: number;
  targetIndex: number;
  offset: number;
  step: number;
  startX: number;
  startScroll: number;
  active: boolean;
};

type DragVisual = {
  tabId: number;
  originIndex: number;
  targetIndex: number;
  offset: number;
  step: number;
};

function moveId(ids: number[], from: number, to: number) {
  if (from === to) {
    return ids;
  }
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export default function TabStrip({
  tabs,
  activeId,
  onSelect,
  onAdd,
  onClose,
  showAdd = true,
  editingId = null,
  editValue = "",
  onEditChange,
  onEditCommit,
  onRename,
  reorderable = false,
  onReorder,
}: TabStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const pointerXRef = useRef(0);
  const autoScrollFrameRef = useRef<number | null>(null);
  const autoScrollSpeedRef = useRef(0);
  const suppressClickRef = useRef(false);
  const [dragVisual, setDragVisual] = useState<DragVisual | null>(null);

  useEffect(() => {
    return () => {
      if (autoScrollFrameRef.current !== null) {
        cancelAnimationFrame(autoScrollFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) {
      return;
    }
    function onTouchMove(event: TouchEvent) {
      if (dragRef.current?.active && event.cancelable) {
        event.preventDefault();
      }
    }
    strip.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => strip.removeEventListener("touchmove", onTouchMove);
  }, []);

  function stopAutoScroll() {
    autoScrollSpeedRef.current = 0;
    if (autoScrollFrameRef.current !== null) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
  }

  function updateDragPreview(pointerX: number) {
    const drag = dragRef.current;
    if (!drag?.active || drag.mode !== "reorder" || drag.tabId === null) {
      return;
    }
    const strip = stripRef.current;
    const scrollDelta = strip ? strip.scrollLeft - drag.startScroll : 0;
    const delta = pointerX - drag.startX + scrollDelta;
    const rawTarget = drag.originIndex + Math.round(delta / drag.step);
    const targetIndex = Math.min(Math.max(rawTarget, 0), tabs.length - 1);
    drag.offset = delta;
    drag.targetIndex = targetIndex;
    setDragVisual({
      tabId: drag.tabId,
      originIndex: drag.originIndex,
      targetIndex,
      offset: delta,
      step: drag.step,
    });
  }

  function runAutoScroll() {
    const strip = stripRef.current;
    const drag = dragRef.current;
    if (!strip || !drag?.active || autoScrollSpeedRef.current === 0) {
      autoScrollFrameRef.current = null;
      return;
    }
    strip.scrollLeft += autoScrollSpeedRef.current;
    updateDragPreview(pointerXRef.current);
    autoScrollFrameRef.current = requestAnimationFrame(runAutoScroll);
  }

  function updateAutoScroll(pointerX: number) {
    const strip = stripRef.current;
    if (!strip) {
      return;
    }
    const rect = strip.getBoundingClientRect();
    let speed = 0;
    if (pointerX < rect.left + EDGE_SCROLL_ZONE) {
      speed = -EDGE_SCROLL_SPEED;
    } else if (pointerX > rect.right - EDGE_SCROLL_ZONE) {
      speed = EDGE_SCROLL_SPEED;
    }
    autoScrollSpeedRef.current = speed;
    if (speed === 0) {
      stopAutoScroll();
      return;
    }
    if (autoScrollFrameRef.current === null) {
      autoScrollFrameRef.current = requestAnimationFrame(runAutoScroll);
    }
  }

  function startDrag(event: React.PointerEvent, tabElement: HTMLElement) {
    const tabId = Number(tabElement.dataset.tabId);
    const originIndex = tabs.findIndex((tab) => tab.id === tabId);
    if (originIndex === -1) {
      return;
    }
    const rect = tabElement.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      mode: "reorder",
      tabId,
      originIndex,
      targetIndex: originIndex,
      offset: 0,
      step: Math.max(rect.width, 1) + TAB_GAP,
      startX: event.clientX,
      startScroll: stripRef.current?.scrollLeft ?? 0,
      active: false,
    };
  }

  function startScrollDrag(event: React.PointerEvent) {
    dragRef.current = {
      pointerId: event.pointerId,
      mode: "scroll",
      tabId: null,
      originIndex: -1,
      targetIndex: -1,
      offset: 0,
      step: 0,
      startX: event.clientX,
      startScroll: stripRef.current?.scrollLeft ?? 0,
      active: false,
    };
  }

  function onPointerDown(event: React.PointerEvent) {
    if (dragRef.current) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest("button, input, textarea, select")) {
      return;
    }
    suppressClickRef.current = false;
    const tabElement = target.closest<HTMLElement>("[data-tab-id]");
    if (tabElement && reorderable && tabs.length > 1) {
      startDrag(event, tabElement);
      return;
    }
    if (event.pointerType !== "mouse") {
      return;
    }
    startScrollDrag(event);
  }

  function onPointerMove(event: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    if (!drag.active) {
      const dx = event.clientX - drag.startX;
      if (Math.abs(dx) < DRAG_THRESHOLD) {
        return;
      }
      drag.active = true;
      suppressClickRef.current = true;
      try {
        stripRef.current?.setPointerCapture(event.pointerId);
      } catch {}
    }
    if (drag.mode === "scroll") {
      if (event.pointerType === "mouse" && stripRef.current) {
        stripRef.current.scrollLeft =
          drag.startScroll - (event.clientX - drag.startX);
      }
      return;
    }
    event.preventDefault();
    pointerXRef.current = event.clientX;
    updateAutoScroll(event.clientX);
    updateDragPreview(event.clientX);
  }

  function finishPointer(event: React.PointerEvent, commit: boolean) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    stopAutoScroll();
    if (drag.active) {
      if (
        commit &&
        drag.mode === "reorder" &&
        drag.tabId !== null &&
        drag.targetIndex !== drag.originIndex
      ) {
        onReorder?.(
          moveId(
            tabs.map((tab) => tab.id),
            drag.originIndex,
            drag.targetIndex,
          ),
        );
      }
      suppressClickRef.current = true;
      setDragVisual(null);
    }
    dragRef.current = null;
    try {
      stripRef.current?.releasePointerCapture(event.pointerId);
    } catch {}
  }

  function onPointerLeave(event: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || drag.active) {
      return;
    }
    stopAutoScroll();
    dragRef.current = null;
    try {
      stripRef.current?.releasePointerCapture(event.pointerId);
    } catch {}
  }

  function selectTab(id: number) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onSelect(id);
  }

  function renameTab(id: number) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onRename?.(id);
  }

  function shiftForTab(index: number) {
    if (!dragVisual || index === dragVisual.originIndex) {
      return 0;
    }
    if (
      dragVisual.originIndex < dragVisual.targetIndex &&
      index > dragVisual.originIndex &&
      index <= dragVisual.targetIndex
    ) {
      return -dragVisual.step;
    }
    if (
      dragVisual.originIndex > dragVisual.targetIndex &&
      index >= dragVisual.targetIndex &&
      index < dragVisual.originIndex
    ) {
      return dragVisual.step;
    }
    return 0;
  }

  return (
    <div
      ref={stripRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => finishPointer(event, true)}
      onPointerCancel={(event) => finishPointer(event, false)}
      onPointerLeave={onPointerLeave}
      onContextMenu={(event) => {
        if (reorderable) {
          event.preventDefault();
        }
      }}
      className={`tab-strip no-scrollbar flex h-10 select-none items-stretch gap-px overflow-x-auto overscroll-x-contain bg-tab-bar pl-9 sm:h-9 md:pl-0 ${
        dragVisual
          ? "cursor-grabbing touch-none"
          : "cursor-grab touch-pan-x"
      }`}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeId;
        const isDragging = dragVisual?.tabId === tab.id;
        const shift = shiftForTab(index);
        const title = getTabTitle(tab);
        const borderClasses = `${index > 0 ? "border-l" : ""} ${
          index === tabs.length - 1 ? "border-r" : ""
        }`;
        const style: React.CSSProperties = dragVisual
          ? isDragging
            ? {
                transform: `translateX(${dragVisual.offset}px)`,
                transition: "none",
                zIndex: 20,
                position: "relative",
              }
            : {
                transform: `translateX(${shift}px)`,
                transition: SHIFT_TRANSITION,
              }
          : {};
        return (
          <div
            key={tab.id}
            data-tab-id={tab.id}
            style={style}
            onClick={() => selectTab(tab.id)}
            onDoubleClick={() => renameTab(tab.id)}
            className={`group relative flex h-full w-32 shrink-0 cursor-pointer items-center whitespace-nowrap border-t-2 border-edge pl-4 font-mono text-xs transition-colors sm:w-40 ${borderClasses} ${
              reorderable ? "touch-none" : ""
            } ${
              isActive
                ? "border-t-accent bg-tab-active text-foreground/50"
                : "border-t-transparent text-foreground/40 hover:bg-tab-active/50 hover:text-foreground"
            }`}
          >
            {editingId === tab.id ? (
              <input
                autoFocus
                value={editValue}
                onChange={(event) => onEditChange?.(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onEditCommit?.();
                  }
                }}
                onBlur={onEditCommit}
                className="w-full min-w-0 bg-transparent pr-7 font-mono text-xs text-foreground outline-none"
              />
            ) : (
              <span className="truncate pr-9 sm:pr-7">{title}</span>
            )}
            <button
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onClose(tab.id);
              }}
              aria-label="Close tab"
              className="absolute right-1.5 flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-full bg-red-500/20 text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/40 [@media(hover:none)]:h-6 [@media(hover:none)]:w-6 [@media(hover:none)]:opacity-100"
            >
              <IconClose size={10} />
            </button>
          </div>
        );
      })}
      {showAdd && (
        <button
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onAdd}
          aria-label="New tab"
          className="flex h-full shrink-0 cursor-pointer items-center bg-tab-bar px-3 text-foreground/40 transition hover:bg-tab-active hover:text-foreground"
        >
          <IconPlus size={16} />
        </button>
      )}
    </div>
  );
}
