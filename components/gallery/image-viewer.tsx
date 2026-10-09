"use client";

import { useEffect, useRef, useState } from "react";
import IconClose from "../icons/close";
import type { GalleryImage } from "../../lib/types";

const MIN_SCALE = 1;
const MAX_SCALE = 8;

type Zoom = { scale: number; x: number; y: number };

type Point = { x: number; y: number };

type ImageViewerProps = {
  image: GalleryImage;
  onClose: () => void;
};

function clampScale(scale: number) {
  return Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: Point, b: Point) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export default function ImageViewer({ image, onClose }: ImageViewerProps) {
  const [zoom, setZoom] = useState<Zoom>({ scale: MIN_SCALE, x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{
    zoom: Zoom;
    last: Point;
    pinchDistance: number;
    pinchMidpoint: Point;
  } | null>(null);
  const movedDuringGesture = useRef(false);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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
      zoomAt(
        current,
        { x: event.clientX, y: event.clientY },
        Math.exp(-event.deltaY * 0.0015),
      ),
    );
  }

  function handlePointerDown(event: React.PointerEvent) {
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);
    if (pointers.current.size === 1) {
      gesture.current = {
        zoom: zoomRef.current,
        last: point,
        pinchDistance: 0,
        pinchMidpoint: point,
      };
      movedDuringGesture.current = false;
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
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
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
    const anchored = zoomAt(
      track.zoom,
      currentMidpoint,
      currentDistance / track.pinchDistance,
    );
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
    onClose();
  }

  function handleDoubleClick(event: React.MouseEvent) {
    event.stopPropagation();
    setZoom((current) =>
      current.scale === MIN_SCALE
        ? zoomAt(current, { x: event.clientX, y: event.clientY }, 2)
        : { scale: MIN_SCALE, x: 0, y: 0 },
    );
  }

  return (
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
        src={image.dataUrl}
        alt={image.name}
        draggable={false}
        onDoubleClick={handleDoubleClick}
        style={{
          transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
          willChange: "transform",
        }}
        className="max-h-full max-w-full select-none rounded-md object-contain"
      />
      <button
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        aria-label="Close preview"
        className="absolute right-2 top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm bg-black/60 text-foreground/50 transition-colors hover:bg-black/80 hover:text-foreground"
      >
        <IconClose size={12} />
      </button>
    </div>
  );
}
