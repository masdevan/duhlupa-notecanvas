"use client";

import type { RefObject } from "react";
import IconTrash from "../icons/trash";
import type { GalleryImage } from "../../lib/types";

type GalleryGridProps = {
  images: GalleryImage[];
  total: number;
  pageSize: number;
  gridRef: RefObject<HTMLDivElement | null>;
  sentinelRef: RefObject<HTMLDivElement | null>;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
  onLoadMore: () => void;
  onPick: () => void;
};

export default function GalleryGrid({
  images,
  total,
  pageSize,
  gridRef,
  sentinelRef,
  onOpen,
  onDelete,
  onLoadMore,
  onPick,
}: GalleryGridProps) {
  if (total === 0) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 pb-24">
        <p className="font-mono text-xs text-foreground/40">No images yet</p>
        <button
          onClick={onPick}
          className="h-6 w-55 cursor-pointer rounded-sm border border-accent bg-accent font-mono text-[11px] text-base transition-colors hover:brightness-110"
        >
          Add images
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        ref={gridRef}
        className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 p-3 pb-6 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]"
      >
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative aspect-square cursor-pointer overflow-hidden rounded-md bg-raised"
            onClick={() => onOpen(image.id)}
          >
            <img
              src={image.dataUrl}
              alt={image.name}
              className="h-full w-full object-cover"
            />
            <button
              onClick={(event) => {
                event.stopPropagation();
                onDelete(image.id);
              }}
              aria-label={`Delete ${image.name}`}
              className="absolute right-1.5 top-1.5 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-sm bg-black/60 text-red-400 transition-colors hover:bg-black/80 hover:text-red-500 group-hover:flex"
            >
              <IconTrash size={12} />
            </button>
          </div>
        ))}
      </div>
      <div ref={sentinelRef} aria-hidden className="h-px" />
      {total > images.length && (
        <div className="flex flex-col items-center gap-2 pb-24">
          <p className="font-mono text-[11px] text-foreground/40">
            Showing {images.length} of {total}
          </p>
          <button
            onClick={onLoadMore}
            className="h-6 cursor-pointer rounded-sm border border-edge px-3 font-mono text-[11px] text-foreground/50 transition-colors hover:border-accent hover:text-foreground"
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
}
