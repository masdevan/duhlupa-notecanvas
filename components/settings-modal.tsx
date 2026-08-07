"use client";

import { useState } from "react";
import ColorPicker from "./color-picker";
import IconClose from "./icons/close";

type SettingsModalProps = {
  accentColor: string;
  onAccentColorChange: (color: string) => void;
  onClose: () => void;
};

export default function SettingsModal({
  accentColor,
  onAccentColorChange,
  onClose,
}: SettingsModalProps) {
  const [closing, setClosing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  function requestClose() {
    if (closing) {
      return;
    }
    setClosing(true);
    window.setTimeout(onClose, 150);
  }

  return (
    <div
      onClick={requestClose}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md ${
        closing ? "modal-backdrop-out" : "modal-backdrop"
      }`}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`w-full max-w-md rounded-sm border border-edge bg-raised p-6 shadow-2xl ${
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
        <div className="relative mt-6 flex flex-col items-center gap-4">
          <div className="flex w-full items-center gap-3">
            <button
              onClick={(event) => {
                event.stopPropagation();
                setPickerOpen(!pickerOpen);
              }}
              aria-label="Pick accent color"
              className="h-8 w-8 shrink-0 cursor-pointer rounded-full border border-edge transition-transform hover:scale-110"
              style={{ backgroundColor: accentColor }}
            />
            <span className="font-mono text-xs text-muted">Accent color</span>
          </div>
          {pickerOpen && (
            <ColorPicker
              accentColor={accentColor}
              onAccentColorChange={onAccentColorChange}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
