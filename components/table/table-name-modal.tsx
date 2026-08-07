"use client";

import { useState } from "react";

type TableNameModalProps = {
  onSubmit: (name: string) => void;
  onCancel: () => void;
};

export default function TableNameModal({
  onSubmit,
  onCancel,
}: TableNameModalProps) {
  const [name, setName] = useState("");

  function submit() {
    onSubmit(name.trim() || "Untitled");
  }

  return (
    <div
      onClick={onCancel}
      className="modal-backdrop fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-md"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="modal-panel w-[calc(100%-2rem)] max-w-xs rounded-sm border border-edge bg-raised p-5 shadow-2xl"
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              submit();
            }
          }}
          placeholder="Table name..."
          autoFocus
          className="h-8 w-full rounded-sm border border-edge bg-base px-3 font-mono text-xs text-foreground caret-accent outline-none placeholder:text-foreground/30 focus:border-accent"
        />
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="h-8 flex-1 cursor-pointer rounded-sm border border-edge font-mono text-xs text-foreground/50 transition-colors hover:border-accent hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="h-8 flex-1 cursor-pointer rounded-sm bg-accent font-mono text-xs text-base transition-colors hover:brightness-110"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
