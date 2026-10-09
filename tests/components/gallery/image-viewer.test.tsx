import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import {
  addImages,
  imageFile,
  openPreview,
  previewImage,
  renderGallery,
  scale,
  translateX,
} from "./helpers";
import { clearAllData } from "../../../lib/storage";

describe("ImageViewer", () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it("opens a full size preview when an image is clicked", async () => {
    await renderGallery();
    await openPreview();
    expect(screen.getAllByAltText("shot.png")).toHaveLength(2);
    expect(previewImage()).toHaveClass("max-h-full");
  });

  it("closes the preview on Escape", async () => {
    await renderGallery();
    await openPreview();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getAllByAltText("shot.png")).toHaveLength(1);
  });

  it("closes the preview with the close button", async () => {
    await renderGallery();
    await openPreview();
    fireEvent.click(screen.getByLabelText("Close preview"));
    expect(screen.getAllByAltText("shot.png")).toHaveLength(1);
  });

  it("closes the preview when the backdrop is clicked without a drag", async () => {
    await renderGallery();
    await openPreview();
    fireEvent.click(previewImage().parentElement!);
    expect(screen.getAllByAltText("shot.png")).toHaveLength(1);
  });

  it("does not close the preview after a drag", async () => {
    await renderGallery();
    await openPreview();
    const stage = previewImage().parentElement!;
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 140, clientY: 100 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 140, clientY: 100 });
    fireEvent.click(stage);
    expect(screen.getAllByAltText("shot.png")).toHaveLength(2);
  });

  it("resets the zoom when the preview closes", async () => {
    await renderGallery();
    await addImages(imageFile("one.png"), imageFile("two.png"));
    fireEvent.click(await screen.findByAltText("one.png"));
    fireEvent.wheel(previewImage().parentElement!, {
      deltaY: -200,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByAltText("two.png"));
    expect(scale()).toBe(1);
  });

  it("zooms in on wheel over the preview", async () => {
    await renderGallery();
    await openPreview();
    fireEvent.wheel(previewImage().parentElement!, {
      deltaY: -200,
      clientX: 100,
      clientY: 100,
    });
    expect(scale()).toBeGreaterThan(1.3);
  });

  it("clamps wheel zoom to the maximum scale", async () => {
    await renderGallery();
    await openPreview();
    const stage = previewImage().parentElement!;
    for (let i = 0; i < 40; i += 1) {
      fireEvent.wheel(stage, { deltaY: -200, clientX: 100, clientY: 100 });
    }
    expect(scale()).toBe(8);
  });

  it("stays centered when zooming out from full size", async () => {
    await renderGallery();
    await openPreview();
    fireEvent.wheel(previewImage().parentElement!, {
      deltaY: 200,
      clientX: 100,
      clientY: 100,
    });
    expect(previewImage().style.transform).toContain(
      "translate(0px, 0px) scale(1)",
    );
    expect(screen.getAllByAltText("shot.png")).toHaveLength(2);
  });

  it("snaps the offset back to center when zooming out past full size", async () => {
    await renderGallery();
    await openPreview();
    const stage = previewImage().parentElement!;
    fireEvent.wheel(stage, { deltaY: -200, clientX: 100, clientY: 100 });
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 180, clientY: 140 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 180, clientY: 140 });
    expect(translateX()).not.toBe(0);
    for (let i = 0; i < 40; i += 1) {
      fireEvent.wheel(stage, { deltaY: 200, clientX: 100, clientY: 100 });
    }
    expect(previewImage().style.transform).toContain(
      "translate(0px, 0px) scale(1)",
    );
    expect(screen.getAllByAltText("shot.png")).toHaveLength(2);
  });

  it("zooms in on double click and resets on the second one", async () => {
    await renderGallery();
    await openPreview();
    fireEvent.doubleClick(previewImage());
    expect(scale()).toBe(2);
    fireEvent.doubleClick(previewImage());
    expect(scale()).toBe(1);
  });

  it("pans the preview when dragging one pointer", async () => {
    await renderGallery();
    await openPreview();
    const stage = previewImage().parentElement!;
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 130, clientY: 90 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 130, clientY: 90 });
    expect(previewImage().style.transform).toContain("translate(30px, -10px)");
  });

  it("zooms when pinching with two pointers", async () => {
    await renderGallery();
    await openPreview();
    const stage = previewImage().parentElement!;
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerDown(stage, { pointerId: 2, clientX: 200, clientY: 100 });
    fireEvent.pointerMove(stage, { pointerId: 2, clientX: 300, clientY: 100 });
    expect(scale()).toBeGreaterThan(1);
  });
});
