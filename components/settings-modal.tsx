"use client";

import { useRef, useState } from "react";
import ColorPicker from "./color-picker";
import ConfirmDialog from "./confirm-dialog";
import IconChevronDown from "./icons/chevron-down";
import IconClose from "./icons/close";
import { isValidState } from "../lib/storage";
import type { AppState } from "../lib/types";

type SettingsModalProps = {
  accentColor: string;
  textColor: string;
  fontFamily: string;
  contentPosition: "left" | "right";
  onSaveColors: (accent: string, text: string) => void;
  onFontChange: (font: string) => void;
  onPositionChange: (position: "left" | "right") => void;
  onResetAll: () => void;
  onClearAll: () => void;
  onExport: () => void;
  onImport: (data: AppState) => void;
  onClose: () => void;
};

function ColorRow({
  color,
  label,
  defaultColor,
  open,
  onToggle,
  onChange,
}: {
  color: string;
  label: string;
  defaultColor: string;
  open: boolean;
  onToggle: () => void;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex w-full items-center gap-3">
      <button
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        aria-label={`Pick ${label}`}
        className="h-8 w-8 shrink-0 cursor-pointer rounded-full border border-edge transition-transform hover:scale-110"
        style={{ backgroundColor: color }}
      />
      <button
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        className="cursor-pointer font-mono text-xs text-foreground/60 transition-colors hover:text-foreground"
      >
        {label}
      </button>
      {open && (
        <ColorPicker
          accentColor={color}
          defaultColor={defaultColor}
          onAccentColorChange={onChange}
          onClose={onToggle}
        />
      )}
    </div>
  );
}

export default function SettingsModal({
  accentColor,
  textColor,
  fontFamily,
  contentPosition,
  onSaveColors,
  onFontChange,
  onPositionChange,
  onResetAll,
  onClearAll,
  onExport,
  onImport,
  onClose,
}: SettingsModalProps) {
  const [closing, setClosing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState<"accent" | "text" | null>(null);
  const [dialog, setDialog] = useState<"unsaved" | "reset" | "clear" | null>(null);
  const [importError, setImportError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draftAccent, setDraftAccent] = useState(accentColor);
  const [draftText, setDraftText] = useState(textColor);
  const [draftFont, setDraftFont] = useState(fontFamily);
  const [draftPosition, setDraftPosition] = useState(contentPosition);
  const dirty =
    draftAccent !== accentColor ||
    draftText !== textColor ||
    draftFont !== fontFamily ||
    draftPosition !== contentPosition;

  function close() {
    if (closing) {
      return;
    }
    setClosing(true);
    window.setTimeout(onClose, 150);
  }

  function requestClose() {
    if (dirty) {
      setDialog("unsaved");
      return;
    }
    close();
  }

  function save() {
    onSaveColors(draftAccent, draftText);
    onFontChange(draftFont);
    onPositionChange(draftPosition);
    close();
  }

  function reset() {
    onResetAll();
    setDraftAccent("#39bff3");
    setDraftText("#f5f5f5");
    setDraftFont("mono");
    setDraftPosition("left");
    setDialog(null);
  }

  function togglePicker(kind: "accent" | "text") {
    setPickerOpen(pickerOpen === kind ? null : kind);
  }

  function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    file
      .text()
      .then((text) => {
        const data = JSON.parse(text);
        if (!isValidState(data)) {
          setImportError(true);
          return;
        }
        onImport(data);
        close();
      })
      .catch(() => {
        setImportError(true);
      });
  }

  return (
    <>
    <div
      onClick={requestClose}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md ${
        closing ? "modal-backdrop-out" : "modal-backdrop"
      }`}
    >
      <div
        onClick={(event) => {
          event.stopPropagation();
          setPickerOpen(null);
        }}
        className={`w-[calc(100%-2rem)] max-w-md rounded-sm border border-edge bg-raised p-4 shadow-2xl sm:p-6 ${
          closing ? "modal-panel-out" : "modal-panel"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm text-foreground">Settings</h2>
          <button
            onClick={requestClose}
            aria-label="Close settings"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-foreground/50 transition-colors hover:bg-tab-active hover:text-foreground"
          >
            <IconClose size={14} />
          </button>
        </div>
        <div className="relative mt-6 flex flex-col gap-4">
          <ColorRow
            color={draftAccent}
            label="Accent color"
            defaultColor="#39bff3"
            open={pickerOpen === "accent"}
            onToggle={() => togglePicker("accent")}
            onChange={setDraftAccent}
          />
          <ColorRow
            color={draftText}
            label="Text color"
            defaultColor="#f5f5f5"
            open={pickerOpen === "text"}
            onToggle={() => togglePicker("text")}
            onChange={setDraftText}
          />
          <div className="flex w-full items-center gap-3">
            <span className="font-mono text-xs text-foreground/60">Font</span>
            <div className="relative ml-auto w-[calc(50%-0.25rem)]">
              <select
                value={draftFont}
                onChange={(event) => setDraftFont(event.target.value)}
                style={{ colorScheme: "dark" }}
                className="h-8 w-full cursor-pointer appearance-none rounded-sm border border-edge bg-transparent pl-3 pr-8 font-mono text-xs text-foreground/50 outline-none transition-colors hover:border-accent hover:text-foreground"
              >
                <option value="mono">Mono</option>
                <option value="sans">Sans</option>
              </select>
              <IconChevronDown
                size={12}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-foreground/50"
              />
            </div>
          </div>
          <div className="flex w-full items-center gap-3">
            <span className="font-mono text-xs text-foreground/60">Position</span>
            <div className="relative ml-auto w-[calc(50%-0.25rem)]">
              <select
                value={draftPosition}
                onChange={(event) =>
                  setDraftPosition(event.target.value as "left" | "right")
                }
                style={{ colorScheme: "dark" }}
                className="h-8 w-full cursor-pointer appearance-none rounded-sm border border-edge bg-transparent pl-3 pr-8 font-mono text-xs text-foreground/50 outline-none transition-colors hover:border-accent hover:text-foreground"
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
              <IconChevronDown
                size={12}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-foreground/50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDialog("reset")}
              className="h-8 flex-1 cursor-pointer rounded-sm border border-edge font-mono text-xs text-foreground/50 transition-colors hover:border-accent hover:text-foreground"
            >
              Reset
            </button>
            <button
              onClick={save}
              className="h-8 flex-1 cursor-pointer rounded-sm bg-accent font-mono text-xs text-base transition-colors hover:brightness-110"
            >
              Save
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onExport}
              className="h-8 flex-1 cursor-pointer rounded-sm border border-edge font-mono text-xs text-foreground/50 transition-colors hover:border-accent hover:text-foreground"
            >
              Export data
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-8 flex-1 cursor-pointer rounded-sm border border-edge font-mono text-xs text-foreground/50 transition-colors hover:border-accent hover:text-foreground"
            >
              Import data
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
          {importError && (
            <p className="text-center font-mono text-xs text-red-400">
              Invalid backup file.
            </p>
          )}
          <button
            onClick={() => setDialog("clear")}
            className="h-8 w-full cursor-pointer rounded-sm border border-red-500/30 font-mono text-xs text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            Clear all data
          </button>
          <a
            href="https://devansugiharta.my.id"
            target="_blank"
            rel="noopener noreferrer"
            className="pt-2 text-center font-mono text-[10px] text-foreground/15 transition-colors hover:text-accent"
          >
            created by Devan
          </a>
        </div>
      </div>
      {dialog && (
        <ConfirmDialog
          message={
            dialog === "unsaved"
              ? "You have unsaved changes."
              : dialog === "reset"
                ? "Reset all settings to default?"
                : "Clear all data? This cannot be undone."
          }
          confirmLabel={
            dialog === "unsaved"
              ? "Discard"
              : dialog === "reset"
                ? "Reset"
                : "Clear"
          }
          cancelLabel="Cancel"
          danger={dialog === "clear"}
          onConfirm={() => {
            if (dialog === "unsaved") {
              setDialog(null);
              close();
            } else if (dialog === "reset") {
              reset();
            } else {
              onClearAll();
              setDialog(null);
              close();
            }
          }}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
    </>
  );
}
