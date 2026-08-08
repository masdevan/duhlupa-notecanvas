"use client";

import { useEffect, useState } from "react";
import SettingsButton from "./settings-button";
import SettingsModal from "./settings-modal";
import { defaultState, initialState, saveState } from "../lib/storage";
import type { AppState } from "../lib/types";

const DEFAULT_ACCENT = "#39bff3";
const DEFAULT_TEXT = "#f5f5f5";
const DEFAULT_FONT = "mono";

const FONT_STACKS: Record<string, string> = {
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  sans: "var(--font-roboto), Arial, Helvetica, sans-serif",
};

function applyColors(accent: string, text: string) {
  document.documentElement.style.setProperty("--color-accent", accent);
  document.documentElement.style.setProperty("--color-foreground", text);
}

function applyFont(font: string) {
  const stack = FONT_STACKS[font] ?? FONT_STACKS.mono;
  document.documentElement.style.setProperty("--font-sans", stack);
  document.documentElement.style.setProperty("--font-mono", stack);
  document.documentElement.style.setProperty("--font-editor", stack);
}

function applyPosition(position: "left" | "right") {
  document.documentElement.classList.toggle(
    "settings-right",
    position === "right",
  );
}

function applyLetterSpacing(spacing: number) {
  document.documentElement.style.setProperty(
    "--letter-spacing",
    `${spacing}px`,
  );
}

function mergeSettings(
  partial: Partial<
    Pick<
      AppState,
      | "accentColor"
      | "textColor"
      | "fontFamily"
      | "wrapWidth"
      | "letterSpacing"
      | "contentPosition"
    >
  >,
) {
  return { ...initialState(), ...partial };
}

export default function Settings() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT);
  const [fontFamily, setFontFamily] = useState(DEFAULT_FONT);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [contentPosition, setContentPosition] = useState<"left" | "right">("left");

  useEffect(() => {
    const next = initialState();
    setAccentColor(next.accentColor);
    setTextColor(next.textColor);
    setFontFamily(next.fontFamily);
    setLetterSpacing(next.letterSpacing);
    setContentPosition(next.contentPosition);
    applyColors(next.accentColor, next.textColor);
    applyFont(next.fontFamily);
    applyPosition(next.contentPosition);
    applyLetterSpacing(next.letterSpacing);
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  function saveColors(accent: string, text: string) {
    saveState(mergeSettings({ accentColor: accent, textColor: text }));
    applyColors(accent, text);
    setAccentColor(accent);
    setTextColor(text);
  }

  function saveFont(font: string) {
    saveState(mergeSettings({ fontFamily: font }));
    applyFont(font);
    setFontFamily(font);
  }

  function saveLetterSpacing(spacing: number) {
    saveState(mergeSettings({ letterSpacing: spacing }));
    applyLetterSpacing(spacing);
    setLetterSpacing(spacing);
  }

  function savePosition(position: "left" | "right") {
    saveState(mergeSettings({ contentPosition: position }));
    setContentPosition(position);
    applyPosition(position);
  }

  function resetAll() {
    saveState(
      mergeSettings({
        accentColor: DEFAULT_ACCENT,
        textColor: DEFAULT_TEXT,
        fontFamily: DEFAULT_FONT,
        wrapWidth: null,
      }),
    );
    applyColors(DEFAULT_ACCENT, DEFAULT_TEXT);
    applyFont(DEFAULT_FONT);
    setAccentColor(DEFAULT_ACCENT);
    setTextColor(DEFAULT_TEXT);
    setFontFamily(DEFAULT_FONT);
  }

  function clearAll() {
    try {
      localStorage.removeItem("duhlupa-tabs");
      localStorage.removeItem("duhlupa-tables");
    } catch {}
    applyColors(DEFAULT_ACCENT, DEFAULT_TEXT);
    applyFont(DEFAULT_FONT);
    window.dispatchEvent(new Event("duhlupa-data-changed"));
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(initialState(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Duhlupa-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importData(data: AppState) {
    saveState(data);
    applyColors(data.accentColor, data.textColor);
    applyFont(data.fontFamily);
    setAccentColor(data.accentColor);
    setTextColor(data.textColor);
    setFontFamily(data.fontFamily);
    window.dispatchEvent(new Event("duhlupa-data-changed"));
  }

  return (
    <>
      <SettingsButton onOpen={() => setOpen(true)} />
      {open && (
        <SettingsModal
          accentColor={accentColor}
          textColor={textColor}
          fontFamily={fontFamily}
          letterSpacing={letterSpacing}
          contentPosition={contentPosition}
          onSaveColors={saveColors}
          onFontChange={saveFont}
          onLetterSpacingChange={saveLetterSpacing}
          onPositionChange={savePosition}
          onResetAll={resetAll}
          onClearAll={clearAll}
          onExport={exportData}
          onImport={importData}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
