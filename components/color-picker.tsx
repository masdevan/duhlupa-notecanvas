"use client";

import { useRef, useState } from "react";
import ConfirmDialog from "./confirm-dialog";
import IconClose from "./icons/close";

type ColorPickerProps = {
  accentColor: string;
  defaultColor: string;
  onAccentColorChange: (color: string) => void;
  onClose: () => void;
};

function hslToHex(hue: number, sat: number, light: number) {
  const s = sat / 100;
  const l = light / 100;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function hexToHsl(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const light = (max + min) / 2;
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * light - 1));
  let hue = 0;
  if (d > 0) {
    if (max === r) {
      hue = ((g - b) / d) % 6;
    } else if (max === g) {
      hue = (b - r) / d + 2;
    } else {
      hue = (r - g) / d + 4;
    }
    hue = (hue * 60 + 360) % 360;
  }
  return { hue, sat: sat * 100, light: light * 100 };
}

function dotForHue(hue: number, radius = 49) {
  const angle = ((hue - 90) * Math.PI) / 180;
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
}

export default function ColorPicker({
  accentColor,
  defaultColor,
  onAccentColorChange,
  onClose,
}: ColorPickerProps) {
  const [closing, setClosing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hue, setHue] = useState(() => hexToHsl(accentColor).hue);
  const [sat, setSat] = useState(() => hexToHsl(accentColor).sat);
  const [light, setLight] = useState(() => hexToHsl(accentColor).light);
  const [dot, setDot] = useState(() => dotForHue(hexToHsl(accentColor).hue));
  const initialColor = useRef(accentColor);
  const ringRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dirty = accentColor !== initialColor.current;

  function close() {
    if (closing) {
      return;
    }
    setClosing(true);
    window.setTimeout(onClose, 150);
  }

  function requestClose() {
    if (dirty) {
      setConfirmOpen(true);
      return;
    }
    close();
  }

  function emit(h: number, s: number, l: number) {
    onAccentColorChange(hslToHex(h, s, l));
  }

  function pickHue(event: React.PointerEvent) {
    const ring = ringRef.current;
    if (!ring) {
      return;
    }
    const rect = ring.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const dist = Math.hypot(dx, dy);
    const radius = Math.min(Math.max(dist, 40), rect.width / 2);
    const scale = dist > 0 ? radius / dist : 0;
    setDot({ x: dx * scale, y: dy * scale });
    const screenAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const nextHue = (screenAngle + 90 + 360) % 360;
    setHue(nextHue);
    emit(nextHue, sat, light);
  }

  function pickSatLight(event: React.PointerEvent) {
    const box = boxRef.current;
    if (!box) {
      return;
    }
    const rect = box.getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
    const nextSat = Math.round(x * 100);
    const nextLight = Math.round((1 - y) * 100);
    setSat(nextSat);
    setLight(nextLight);
    emit(hue, nextSat, nextLight);
  }

  function resetColor() {
    const parsed = hexToHsl(defaultColor);
    setHue(parsed.hue);
    setSat(parsed.sat);
    setLight(parsed.light);
    setDot(dotForHue(parsed.hue));
    onAccentColorChange(defaultColor);
  }

  return (
    <>
    <div
      onClick={(event) => {
        event.stopPropagation();
        requestClose();
      }}
      className={`fixed inset-0 z-60 flex items-center justify-center bg-black/30 backdrop-blur-md ${
        closing ? "modal-backdrop-out" : "modal-backdrop"
      }`}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`relative rounded-sm border border-edge bg-raised shadow-2xl ${
          closing ? "modal-panel-out" : "modal-panel"
        }`}
      >
        <button
          onClick={requestClose}
          aria-label="Close color picker"
          className="absolute -right-2 -top-2 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-edge bg-raised text-foreground/50 shadow transition-colors hover:text-foreground"
        >
          <IconClose size={12} />
        </button>
        <div className="flex max-h-[80dvh] flex-col items-stretch gap-4 overflow-y-auto p-4 sm:p-5">
        <div className="flex flex-row items-center gap-4 sm:gap-5">
          <div
            ref={ringRef}
            onPointerDown={(event) => {
              dragging.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              pickHue(event);
            }}
            onPointerMove={(event) => {
              if (dragging.current) {
                pickHue(event);
              }
            }}
            onPointerUp={() => {
              dragging.current = false;
            }}
            onPointerCancel={() => {
              dragging.current = false;
            }}
            className="relative h-32 w-32 cursor-pointer touch-none rounded-full sm:h-36 sm:w-36"
            style={{
              background:
                "radial-gradient(circle, #121212 0 39.5%, transparent 40.5%), conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
            }}
          >
            <span
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
              style={{
                left: `calc(50% + ${dot.x}px)`,
                top: `calc(50% + ${dot.y}px)`,
                backgroundColor: `hsl(${hue} ${sat}% ${light}%)`,
              }}
            />
          </div>
          <div
            ref={boxRef}
            onPointerDown={(event) => {
              dragging.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              pickSatLight(event);
            }}
            onPointerMove={(event) => {
              if (dragging.current) {
                pickSatLight(event);
              }
            }}
            onPointerUp={() => {
              dragging.current = false;
            }}
            onPointerCancel={() => {
              dragging.current = false;
            }}
            className="relative h-32 w-32 cursor-pointer touch-none rounded-sm sm:h-36 sm:w-40"
            style={{
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue} 100% 50%))`,
            }}
          >
            <span
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
              style={{
                left: `${sat}%`,
                top: `${100 - light}%`,
                backgroundColor: `hsl(${hue} ${sat}% ${light}%)`,
              }}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetColor}
            className="h-8 flex-1 cursor-pointer rounded-sm border border-edge font-mono text-xs text-foreground/50 transition-colors hover:border-accent hover:text-foreground"
          >
            Reset
          </button>
          <button
            onClick={close}
            className="h-8 flex-1 cursor-pointer rounded-sm bg-accent font-mono text-xs text-base transition-colors hover:brightness-110"
          >
            Save
          </button>
        </div>
        </div>
      </div>
    </div>
      {confirmOpen && (
        <ConfirmDialog
          message="You have unsaved changes."
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          onConfirm={() => {
            setConfirmOpen(false);
            close();
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}