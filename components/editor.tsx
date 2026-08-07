"use client";

import { useEffect, useRef, useState } from "react";

type EditorProps = {
  content: string;
  wrapWidth: number | null;
  onChange: (content: string) => void;
  onWrapWidthChange: (width: number) => void;
};

export default function Editor({
  content,
  wrapWidth,
  onChange,
  onWrapWidthChange,
}: EditorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const dragHandle = useRef<{
    startX: number;
    startWidth: number;
    edge: "left" | "right";
  } | null>(null);
  const [wrapperW, setWrapperW] = useState(0);

  useEffect(() => {
    function measure() {
      if (wrapperRef.current) {
        setWrapperW(wrapperRef.current.clientWidth);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    function onMove(event: MouseEvent) {
      const handle = dragHandle.current;
      if (!handle) {
        return;
      }
      const delta = event.clientX - handle.startX;
      const width =
        handle.startWidth + (handle.edge === "right" ? delta : -delta);
      onWrapWidthChange(Math.min(Math.max(width, 320), wrapperW));
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
  }, [wrapperW, onWrapWidthChange]);

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
    onWrapWidthChange(Math.min(Math.max(width, 320), wrapperW));
  }

  function onHandlePointerUp() {
    dragHandle.current = null;
  }

  return (
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
          value={content}
          onChange={(event) => onChange(event.target.value)}
          style={{ fieldSizing: "content" }}
          className="w-full resize-none bg-transparent px-3 pb-16 pt-6 font-mono text-sm leading-4 text-foreground caret-accent outline-none placeholder:text-foreground/30 sm:px-6 sm:pb-20 sm:pt-8 sm:text-base sm:leading-5 md:px-10 lg:px-14"
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
  );
}
