"use client";

import { useEffect, useRef, useState } from "react";
import ConfirmDialog from "../confirm-dialog";
import GalleryGrid from "./gallery-grid";
import GalleryToolbar from "./gallery-toolbar";
import ImageViewer from "./image-viewer";
import {
  clearGalleryImages,
  initStorage,
  initialGalleryManifest,
  loadGalleryImages,
  removeGalleryImages,
  saveGalleryImages,
} from "../../lib/storage";
import type { GalleryImage } from "../../lib/types";

const ROWS_PER_PAGE = 5;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [total, setTotal] = useState(0);
  const [visible, setVisible] = useState(0);
  const [columns, setColumns] = useState(1);
  const [ready, setReady] = useState(false);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const pageSize = Math.max(1, columns * ROWS_PER_PAGE);
  const preview = images.find((image) => image.id === previewId) ?? null;

  async function reload() {
    const manifest = initialGalleryManifest();
    setTotal(manifest.ids.length);
    setImages(await loadGalleryImages(manifest.ids.slice(0, visible)));
  }

  useEffect(() => {
    initStorage().then(() => {
      setTotal(initialGalleryManifest().ids.length);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    function handleReload() {
      initStorage().then(() => {
        setVisible(0);
        reload();
      });
    }
    window.addEventListener("duhlupa-data-changed", handleReload);
    return () =>
      window.removeEventListener("duhlupa-data-changed", handleReload);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const ids = initialGalleryManifest().ids;
    setTotal(ids.length);
    loadGalleryImages(ids.slice(0, visible)).then(setImages);
  }, [ready, visible]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) {
      return;
    }
    const measure = () => {
      const track = getComputedStyle(grid).gridTemplateColumns;
      setColumns(Math.max(1, track.split(" ").filter(Boolean).length));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [ready, total > 0]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible((current) =>
            current >= total ? current : current + pageSize,
          );
        }
      },
      { root: scrollRef.current, threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [pageSize, total]);

  async function addFiles(files: File[]) {
    const accepted = files.filter((file) => file.type.startsWith("image/"));
    if (accepted.length === 0) {
      return;
    }
    const counter = initialGalleryManifest().counter;
    const loaded = await Promise.all(
      accepted.map(async (file, index): Promise<GalleryImage> => ({
        id: counter + index + 1,
        name: file.name || `Pasted image ${counter + index + 1}`,
        type: file.type,
        dataUrl: await readAsDataUrl(file),
      })),
    );
    await saveGalleryImages(loaded);
    setVisible((current) => current + loaded.length);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const files = Array.from(event.clipboardData?.files ?? []).filter((file) =>
        file.type.startsWith("image/"),
      );
      if (files.length > 0) {
        event.preventDefault();
        addFiles(files);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPendingDeleteId(null);
        setDeleteAllOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function removeImage(id: number) {
    await removeGalleryImages([id]);
    await reload();
    setPendingDeleteId(null);
    setPreviewId(null);
  }

  async function removeAllImages() {
    await clearGalleryImages();
    setVisible(0);
    setImages([]);
    setTotal(0);
    setDeleteAllOpen(false);
    setPreviewId(null);
  }

  function handleFilePick(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    addFiles(files);
  }

  if (!ready) {
    return <main className="h-dvh bg-surface" />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-card">
      <GalleryToolbar
        total={total}
        onPick={() => fileInputRef.current?.click()}
        onDeleteAll={() => setDeleteAllOpen(true)}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilePick}
        className="hidden"
      />

      <div
        ref={scrollRef}
        className="editor-scroll min-h-0 flex-1 overflow-y-auto"
      >
        <GalleryGrid
          images={images}
          total={total}
          pageSize={pageSize}
          gridRef={gridRef}
          sentinelRef={sentinelRef}
          onOpen={setPreviewId}
          onDelete={setPendingDeleteId}
          onLoadMore={() => setVisible((current) => current + pageSize)}
          onPick={() => fileInputRef.current?.click()}
        />
      </div>

      {preview && (
        <ImageViewer image={preview} onClose={() => setPreviewId(null)} />
      )}

      {pendingDeleteId !== null && (
        <ConfirmDialog
          message="Delete this image?"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          danger
          onConfirm={() => removeImage(pendingDeleteId)}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}

      {deleteAllOpen && (
        <ConfirmDialog
          message="Delete all images? This cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          danger
          onConfirm={removeAllImages}
          onCancel={() => setDeleteAllOpen(false)}
        />
      )}
    </div>
  );
}
