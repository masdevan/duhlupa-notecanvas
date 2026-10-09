"use client";

import { useEffect, useRef, useState } from "react";
import ConfirmDialog from "../confirm-dialog";
import IconClose from "../icons/close";
import IconPlus from "../icons/plus";
import IconTrash from "../icons/trash";
import {
  defaultGalleryState,
  initStorage,
  initialGalleryState,
  saveGalleryState,
} from "../../lib/storage";
import type { GalleryImage, GalleryState } from "../../lib/types";

const MIN_SCALE = 1;
const MAX_SCALE = 8;

type Zoom = { scale: number; x: number; y: number };

type Point = { x: number; y: number };

function clampScale(scale: number) {
  return Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: Point, b: Point) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export default function Gallery() {
  const [state, setState] = useState<GalleryState>(defaultGalleryState);
  const [ready, setReady] = useState(false);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [zoom, setZoom] = useState<Zoom>({ scale: 1, x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{
    zoom: Zoom;
    last: Point;
    pinchDistance: number;
    pinchMidpoint: Point;
  } | null>(null);
  const movedDuringGesture = useRef(false);
  const stateRef = useRef(state);
  const zoomRef = useRef(zoom);
  stateRef.current = state;
  zoomRef.current = zoom;

  useEffect(() => {
    initStorage().then(() => {
      setState(initialGalleryState());
      setReady(true);
    });
  }, []);

  useEffect(() => {
    function reload() {
      initStorage().then(() => setState(initialGalleryState()));
    }
    window.addEventListener("duhlupa-data-changed", reload);
    return () => window.removeEventListener("duhlupa-data-changed", reload);
  }, []);

  async function addFiles(files: File[]) {
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) {
      return;
    }
    const loaded = await Promise.all(
      images.map(async (file, index): Promise<GalleryImage> => ({
        id: stateRef.current.counter + index + 1,
        name: file.name || `Pasted image ${stateRef.current.counter + index + 1}`,
        type: file.type,
        dataUrl: await readAsDataUrl(file),
      })),
    );
    const next: GalleryState = {
      images: [...loaded, ...stateRef.current.images],
      counter: stateRef.current.counter + loaded.length,
    };
    setState(next);
    saveGalleryState(next);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const files = Array.from(event.clipboardData?.files ?? []).filter((file) =>
        file.type.startsWith("image/"),
      );
      if (files.length > 0) {
        event.preventDefault();
        addFiles(files);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePreview();
        setPendingDeleteId(null);
        setDeleteAllOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function commitImages(images: GalleryImage[], counter: number) {
    const next: GalleryState = { images, counter };
    setState(next);
    saveGalleryState(next);
  }

  function removeImage(id: number) {
    commitImages(
      state.images.filter((image) => image.id !== id),
      state.counter,
    );
    setPendingDeleteId(null);
    closePreview();
  }

  function removeAllImages() {
    commitImages([], 0);
    setDeleteAllOpen(false);
    closePreview();
  }

  function handleFilePick(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    addFiles(files);
  }

  function closePreview() {
    setPreviewId(null);
    setZoom({ scale: 1, x: 0, y: 0 });
  }

  function openPreview(id: number) {
    setPreviewId(id);
    setZoom({ scale: 1, x: 0, y: 0 });
  }

  function zoomAt(next: Zoom, anchor: Point, factor: number): Zoom {
    const scale = clampScale(next.scale * factor);
    if (scale === MIN_SCALE) {
      return { scale: MIN_SCALE, x: 0, y: 0 };
    }
    const stage = stageRef.current;
    if (!stage || scale === next.scale) {
      return { ...next, scale };
    }
    const rect = stage.getBoundingClientRect();
    const originX = rect.left + rect.width / 2 + next.x;
    const originY = rect.top + rect.height / 2 + next.y;
    const applied = scale / next.scale;
    return {
      scale,
      x: next.x + (anchor.x - originX) * (1 - applied),
      y: next.y + (anchor.y - originY) * (1 - applied),
    };
  }

  function handleWheel(event: React.WheelEvent) {
    event.preventDefault();
    setZoom((current) =>
      zoomAt(current, { x: event.clientX, y: event.clientY }, Math.exp(-event.deltaY * 0.0015)),
    );
  }

  function beginGesture(point: Point) {
    gesture.current = {
      zoom: zoomRef.current,
      last: point,
      pinchDistance: 0,
      pinchMidpoint: point,
    };
    movedDuringGesture.current = false;
  }

  function handlePointerDown(event: React.PointerEvent) {
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);
    if (pointers.current.size === 1) {
      beginGesture(point);
      return;
    }
    const track = gesture.current;
    if (track && pointers.current.size === 2) {
      const [first, second] = [...pointers.current.values()];
      gesture.current = {
        ...track,
        pinchDistance: distance(first, second),
        pinchMidpoint: midpoint(first, second),
      };
    }
  }

  function handlePointerMove(event: React.PointerEvent) {
    if (!pointers.current.has(event.pointerId)) {
      return;
    }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const track = gesture.current;
    if (!track) {
      return;
    }
    const points = [...pointers.current.values()];

    if (points.length === 1) {
      const point = points[0];
      const dx = point.x - track.last.x;
      const dy = point.y - track.last.y;
      if (dx === 0 && dy === 0) {
        return;
      }
      const next: Zoom = {
        ...track.zoom,
        x: track.zoom.x + dx,
        y: track.zoom.y + dy,
      };
      gesture.current = { ...track, zoom: next, last: point };
      setZoom(next);
      movedDuringGesture.current = true;
      return;
    }

    const [first, second] = points;
    const currentDistance = distance(first, second);
    const currentMidpoint = midpoint(first, second);
    const factor = currentDistance / track.pinchDistance;
    const anchored = zoomAt(track.zoom, currentMidpoint, factor);
    const next: Zoom = {
      scale: anchored.scale,
      x: anchored.x + (currentMidpoint.x - track.pinchMidpoint.x),
      y: anchored.y + (currentMidpoint.y - track.pinchMidpoint.y),
    };
    gesture.current = {
      ...track,
      zoom: next,
      last: currentMidpoint,
      pinchDistance: currentDistance,
      pinchMidpoint: currentMidpoint,
    };
    setZoom(next);
    movedDuringGesture.current = true;
  }

  function handlePointerUp(event: React.PointerEvent) {
    pointers.current.delete(event.pointerId);
    const track = gesture.current;
    if (!track) {
      return;
    }
    if (pointers.current.size === 0) {
      gesture.current = null;
      return;
    }
    const remaining = [...pointers.current.values()][0];
    gesture.current = {
      zoom: track.zoom,
      last: remaining,
      pinchDistance: 0,
      pinchMidpoint: remaining,
    };
  }

  function handleStageClick() {
    if (movedDuringGesture.current) {
      movedDuringGesture.current = false;
      return;
    }
    closePreview();
  }

  function handleImageDoubleClick(event: React.MouseEvent) {
    event.stopPropagation();
    setZoom((current) =>
      current.scale === MIN_SCALE
        ? zoomAt(current, { x: event.clientX, y: event.clientY }, 2)
        : { scale: MIN_SCALE, x: 0, y: 0 },
    );
  }

  const preview = state.images.find((image) => image.id === previewId) ?? null;

  if (!ready) {
    return <main className="h-dvh bg-surface" />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-card">
      <div className="flex h-8 shrink-0 items-center gap-3 border-b border-t border-edge bg-[#0c0c0c] pl-9 pr-2 md:pl-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded-sm border border-accent bg-accent px-2 font-mono text-[11px] text-base transition-colors hover:brightness-110"
        >
          <IconPlus size={10} />
          <span>Add images</span>
        </button>
        <span className="hidden shrink-0 font-mono text-[11px] text-foreground/40 sm:inline">
          or paste with Ctrl+V
        </span>
        {state.images.length > 0 && (
          <button
            onClick={() => setDeleteAllOpen(true)}
            aria-label="Delete all images"
            className="ml-auto flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded-sm px-2 font-mono text-[11px] text-red-400 transition-colors hover:bg-red-500/10"
          >
            <IconTrash size={10} />
            <span>Delete all</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilePick}
          className="hidden"
        />
      </div>

      <div
        ref={scrollRef}
        className="editor-scroll min-h-0 flex-1 overflow-y-auto"
      >
      {state.images.length === 0 ? (
        <div className="flex min-h-full flex-col items-center justify-center gap-3 pb-24">
          <p className="font-mono text-xs text-foreground/40">
            No images yet
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-6 w-55 cursor-pointer rounded-sm border border-accent bg-accent font-mono text-[11px] text-base transition-colors hover:brightness-110"
          >
            Add images
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 p-3 pb-24 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
          {state.images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-md bg-raised"
              onClick={() => openPreview(image.id)}
            >
              <img
                src={image.dataUrl}
                alt={image.name}
                className="h-full w-full object-cover"
              />
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setPendingDeleteId(image.id);
                }}
                aria-label={`Delete ${image.name}`}
                className="absolute right-1.5 top-1.5 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-sm bg-black/60 text-red-400 transition-colors hover:bg-black/80 hover:text-red-500 group-hover:flex"
              >
                <IconTrash size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      </div>

      {preview && (
        <div
          ref={stageRef}
          onClick={handleStageClick}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`modal-backdrop fixed inset-0 z-70 flex touch-none items-center justify-center bg-black/80 p-4 backdrop-blur-md ${
            zoom.scale > MIN_SCALE ? "cursor-grab" : "cursor-pointer"
          }`}
        >
          <img
            src={preview.dataUrl}
            alt={preview.name}
            draggable={false}
            onDoubleClick={handleImageDoubleClick}
            style={{
              transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
              willChange: "transform",
            }}
            className="max-h-full max-w-full select-none rounded-md object-contain"
          />
          <button
            onClick={(event) => {
              event.stopPropagation();
              closePreview();
            }}
            aria-label="Close preview"
            className="absolute right-2 top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm bg-black/60 text-foreground/50 transition-colors hover:bg-black/80 hover:text-foreground"
          >
            <IconClose size={12} />
          </button>
        </div>
      )}

      {pendingDeleteId !== null && (
        <ConfirmDialog
          message="Delete this image?"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          danger
          onConfirm={() => removeImage(pendingDeleteId)}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}

      {deleteAllOpen && (
        <ConfirmDialog
          message="Delete all images? This cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          danger
          onConfirm={removeAllImages}
          onCancel={() => setDeleteAllOpen(false)}
        />
      )}
    </div>
  );
}
