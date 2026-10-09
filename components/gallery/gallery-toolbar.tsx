"use client";

import IconPlus from "../icons/plus";
import IconTrash from "../icons/trash";

type GalleryToolbarProps = {
  total: number;
  onPick: () => void;
  onDeleteAll: () => void;
};

export default function GalleryToolbar({
  total,
  onPick,
  onDeleteAll,
}: GalleryToolbarProps) {
  return (
    <div className="flex h-9 shrink-0 items-center gap-3 border-b border-t border-edge bg-[#0c0c0c] pl-9 pr-2 md:pl-4">
      <button
        onClick={onPick}
        className="flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded-sm border border-accent bg-accent px-2 font-mono text-[11px] text-base transition-colors hover:brightness-110"
      >
        <IconPlus size={10} />
        <span>Add images</span>
      </button>
      <span className="hidden shrink-0 font-mono text-[11px] text-foreground/40 sm:inline">
        or paste with Ctrl+V
      </span>
      {total > 0 && (
        <button
          onClick={onDeleteAll}
          aria-label="Delete all images"
          className="ml-auto flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded-sm px-2 font-mono text-[11px] text-red-400 transition-colors hover:bg-red-500/10"
        >
          <IconTrash size={10} />
          <span>Delete all</span>
        </button>
      )}
    </div>
  );
}
