"use client";

import { useState } from "react";

type TableEmptyStateProps = {
  onCreate: (name: string) => void;
};

export default function TableEmptyState({ onCreate }: TableEmptyStateProps) {
  const [name, setName] = useState("");

  function submit() {
    onCreate(name.trim() || "Untitled");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-card">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            submit();
          }
        }}
        placeholder="Table name..."
        className="h-8 w-56 rounded-sm border border-edge bg-base px-3 font-mono text-xs text-foreground caret-accent outline-none placeholder:text-foreground/30 focus:border-accent"
      />
      <button
        onClick={submit}
        className="h-7 w-55 cursor-pointer rounded-sm border border-accent bg-accent font-mono text-xs text-base transition-colors hover:brightness-110"
      >
        Create
      </button>
    </div>
  );
}
