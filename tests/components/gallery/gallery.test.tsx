import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Gallery from "../../../components/gallery/gallery";
import {
  clearAllData,
  defaultGalleryManifest,
  initStorage,
  initialGalleryManifest,
  loadGalleryImages,
} from "../../../lib/storage";

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function imageFile(name = "shot.png") {
  const bytes = Uint8Array.from(atob(PNG.split(",")[1]), (char) =>
    char.charCodeAt(0),
  );
  return new File([bytes], name, { type: "image/png" });
}

function fileInput() {
  return document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
}

function previewImage() {
  return document.querySelector(".fixed img") as HTMLImageElement;
}

function translateX() {
  return Number(
    previewImage().style.transform.match(/translate\(([-\d.]+)px/)?.[1],
  );
}

describe("Gallery", () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it("shows the empty state and both add buttons", async () => {
    render(<Gallery />);
    expect(await screen.findByText("No images yet")).toBeInTheDocument();
    expect(screen.getAllByText("Add images")).toHaveLength(2);
    expect(screen.getByText("or paste with Ctrl+V")).toBeInTheDocument();
  });

  it("adds an image from the file input", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
    expect(await screen.findByAltText("shot.png")).toBeInTheDocument();
  });

  it("ignores files that are not images", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    const text = new File(["hello"], "note.txt", { type: "text/plain" });
    fireEvent.change(fileInput(), { target: { files: [text] } });
    expect(screen.getByText("No images yet")).toBeInTheDocument();
  });

  it("adds an image pasted from the clipboard", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent(window, new Event("paste"));
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", {
      value: { files: [imageFile("pasted.png")] },
    });
    fireEvent(window, event);
    expect(await screen.findByAltText("pasted.png")).toBeInTheDocument();
  });

  it("opens a full size preview when an image is clicked", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
    const tile = await screen.findByAltText("shot.png");
    fireEvent.click(tile);
    expect(screen.getAllByAltText("shot.png")).toHaveLength(2);
    expect(previewImage()).toHaveClass("max-h-full");
  });

  it("closes the preview on Escape", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
    fireEvent.click(await screen.findByAltText("shot.png"));
    expect(screen.getAllByAltText("shot.png")).toHaveLength(2);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getAllByAltText("shot.png")).toHaveLength(1);
  });

  it("deletes an image after confirming", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
    fireEvent.click(await screen.findByLabelText("Delete shot.png"));
    expect(await screen.findByText("Delete this image?")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Delete"));
    expect(await screen.findByText("No images yet")).toBeInTheDocument();
  });

  it("keeps the image when the delete dialog is cancelled", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
    fireEvent.click(await screen.findByLabelText("Delete shot.png"));
    fireEvent.click(await screen.findByText("Cancel"));
    expect(screen.getByAltText("shot.png")).toBeInTheDocument();
  });

  it("closes the preview with the close button", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
    fireEvent.click(await screen.findByAltText("shot.png"));
    fireEvent.click(screen.getByLabelText("Close preview"));
    expect(screen.getAllByAltText("shot.png")).toHaveLength(1);
  });

  it("snaps the offset back to center when zooming out past full size", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
    fireEvent.click(await screen.findByAltText("shot.png"));
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

  it("stays centered when zooming out from full size", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
    fireEvent.click(await screen.findByAltText("shot.png"));
    const stage = previewImage().parentElement!;
    fireEvent.wheel(stage, { deltaY: 200, clientX: 100, clientY: 100 });
    expect(previewImage().style.transform).toContain(
      "translate(0px, 0px) scale(1)",
    );
    expect(screen.getAllByAltText("shot.png")).toHaveLength(2);
  });

  it("zooms in on wheel over the preview", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
    fireEvent.click(await screen.findByAltText("shot.png"));
    fireEvent.wheel(previewImage().parentElement!, {
      deltaY: -200,
      clientX: 100,
      clientY: 100,
    });
    expect(previewImage().style.transform).toContain("scale(1.3");
  });

  it("clamps wheel zoom to the maximum scale", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
    fireEvent.click(await screen.findByAltText("shot.png"));
    const stage = previewImage().parentElement!;
    for (let i = 0; i < 40; i += 1) {
      fireEvent.wheel(stage, { deltaY: -200, clientX: 100, clientY: 100 });
    }
    expect(previewImage().style.transform).toContain("scale(8)");
  });

  it("zooms in on double click and resets on the second one", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
    fireEvent.click(await screen.findByAltText("shot.png"));
    fireEvent.doubleClick(previewImage());
    expect(previewImage().style.transform).toContain("scale(2)");
    fireEvent.doubleClick(previewImage());
    expect(previewImage().style.transform).toContain("scale(1)");
  });

  it("pans the preview when dragging one pointer", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
    fireEvent.click(await screen.findByAltText("shot.png"));
    const stage = previewImage().parentElement!;
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 130, clientY: 90 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 130, clientY: 90 });
    expect(previewImage().style.transform).toContain("translate(30px, -10px)");
  });

  it("zooms when pinching with two pointers", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
    fireEvent.click(await screen.findByAltText("shot.png"));
    const stage = previewImage().parentElement!;
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerDown(stage, { pointerId: 2, clientX: 200, clientY: 100 });
    fireEvent.pointerMove(stage, { pointerId: 2, clientX: 300, clientY: 100 });
    expect(Number(previewImage().style.transform.match(/scale\(([\d.]+)/)![1])).toBeGreaterThan(1);
  });

  it("does not close the preview after a drag", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
    fireEvent.click(await screen.findByAltText("shot.png"));
    const stage = previewImage().parentElement!;
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 140, clientY: 100 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 140, clientY: 100 });
    fireEvent.click(stage);
    expect(screen.getAllByAltText("shot.png")).toHaveLength(2);
  });

  it("closes the preview when the backdrop is clicked without a drag", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
    fireEvent.click(await screen.findByAltText("shot.png"));
    fireEvent.click(previewImage().parentElement!);
    expect(screen.getAllByAltText("shot.png")).toHaveLength(1);
  });

  it("resets the zoom when the preview closes", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), {
      target: { files: [imageFile("one.png"), imageFile("two.png")] },
    });
    fireEvent.click(await screen.findByAltText("one.png"));
    fireEvent.wheel(previewImage().parentElement!, {
      deltaY: -200,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByAltText("two.png"));
    expect(previewImage().style.transform).toContain("scale(1)");
  });

  it("puts newly added images above the existing ones", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), {
      target: { files: [imageFile("one.png"), imageFile("two.png")] },
    });
    await screen.findByAltText("two.png");
    fireEvent.change(fileInput(), { target: { files: [imageFile("new.png")] } });
    await screen.findByAltText("new.png");
    const order = screen
      .getAllByRole("img")
      .map((element) => element.getAttribute("alt"));
    expect(order).toEqual(["new.png", "one.png", "two.png"]);
  });

  it("scrolls back to the top after adding images", async () => {
    const { container } = render(<Gallery />);
    await screen.findByText("No images yet");
    const scroller = container.querySelector(
      ".editor-scroll",
    ) as HTMLDivElement;
    scroller.scrollTop = 120;
    fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
    await screen.findByAltText("shot.png");
    expect(scroller.scrollTop).toBe(0);
  });

  it("hides the delete all button when the gallery is empty", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    expect(screen.queryByLabelText("Delete all images")).not.toBeInTheDocument();
  });

  it("deletes every image after confirming", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), {
      target: { files: [imageFile("one.png"), imageFile("two.png")] },
    });
    expect(await screen.findByAltText("one.png")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Delete all images"));
    expect(
      await screen.findByText("Delete all images? This cannot be undone."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("Delete"));
    expect(await screen.findByText("No images yet")).toBeInTheDocument();
    expect(screen.queryByLabelText("Delete all images")).not.toBeInTheDocument();
  });

  it("keeps every image when delete all is cancelled", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), {
      target: { files: [imageFile("one.png"), imageFile("two.png")] },
    });
    await screen.findByAltText("one.png");
    fireEvent.click(screen.getByLabelText("Delete all images"));
    fireEvent.click(await screen.findByText("Cancel"));
    expect(screen.getByAltText("one.png")).toBeInTheDocument();
    expect(screen.getByAltText("two.png")).toBeInTheDocument();
  });

  it("resets the gallery in storage after delete all", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
    await screen.findByAltText("shot.png");
    fireEvent.click(screen.getByLabelText("Delete all images"));
    fireEvent.click(await screen.findByText("Delete"));
    await screen.findByText("No images yet");
    await initStorage();
    expect(initialGalleryManifest()).toEqual(defaultGalleryManifest());
  });

  it("persists images to indexeddb", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), { target: { files: [imageFile()] } });
    await screen.findByAltText("shot.png");
    await initStorage();
    expect(initialGalleryManifest().ids).toHaveLength(1);
    const stored = await loadGalleryImages(initialGalleryManifest().ids);
    expect(stored[0].dataUrl).toBe(PNG);
  });

  it("shows how many images are loaded out of the total", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), {
      target: {
        files: Array.from({ length: 40 }, (_, index) =>
          imageFile(`bulk-${index}.png`),
        ),
      },
    });
    expect(await screen.findByText(/Showing \d+ of 40/)).toBeInTheDocument();
  });

  it("loads the next page when the sentinel is scrolled into view", async () => {
    render(<Gallery />);
    await screen.findByText("No images yet");
    fireEvent.change(fileInput(), {
      target: {
        files: Array.from({ length: 30 }, (_, index) =>
          imageFile(`page-${index}.png`),
        ),
      },
    });
    const counter = await screen.findByText(/Showing \d+ of 30/);
    const shown = Number(counter.textContent!.match(/Showing (\d+)/)![1]);
    fireEvent.click(screen.getByText("Load more"));
    await screen.findByText(
      `Showing ${shown + 5} of 30`,
      {},
      { timeout: 2000 },
    );
  });
});
