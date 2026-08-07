"use client";

import { useState } from "react";
import ColorPicker from "./color-picker";
import IconClose from "./icons/close";

type SettingsModalProps = {
  accentColor: string;
  textColor: string;
  onAccentColorChange: (color: string) => void;
  onTextColorChange: (color: string) => void;
  onClose: () => void;
};

function ColorRow({
  color,
  label,
  open,
  onToggle,
  onChange,
}: {
  color: string;
  label: string;
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
        className="cursor-pointer font-mono text-xs text-muted transition-colors hover:text-foreground"
      >
        {label}
      </button>
      {open && (
        <ColorPicker
          accentColor={color}
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
  onAccentColorChange,
  onTextColorChange,
  onClose,
}: SettingsModalProps) {
  const [closing, setClosing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState<"accent" | "text" | null>(null);

  function requestClose() {
    if (closing) {
      return;
    }
    setClosing(true);
    window.setTimeout(onClose, 150);
  }

  function togglePicker(kind: "accent" | "text") {
    setPickerOpen(pickerOpen === kind ? null : kind);
  }

  return (
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
        className={`w-[calc(100%-2rem)] max-w-md rounded-sm border border-edge bg-raised p-5 shadow-2xl sm:p-6 ${
          closing ? "modal-panel-out" : "modal-panel"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm text-foreground">Settings</h2>
          <button
            onClick={requestClose}
            aria-label="Close settings"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-muted transition-colors hover:bg-tab-active hover:text-foreground"
          >
            <IconClose size={14} />
          </button>
        </div>
        <div className="relative mt-6 flex flex-col gap-4">
          <ColorRow
            color={accentColor}
            label="Accent color"
            open={pickerOpen === "accent"}
            onToggle={() => togglePicker("accent")}
            onChange={onAccentColorChange}
          />
          <ColorRow
            color={textColor}
            label="Text color"
            open={pickerOpen === "text"}
            onToggle={() => togglePicker("text")}
            onChange={onTextColorChange}
          />
        </div>
      </div>
    </div>
  );
}
