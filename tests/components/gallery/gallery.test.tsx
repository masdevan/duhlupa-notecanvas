import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import {
  addImages,
  fileInput,
  imageFile,
  PNG,
  renderGallery,
  renderSeededGallery,
} from "./helpers";
import {
  clearAllData,
  defaultGalleryManifest,
  initStorage,
  initialGalleryManifest,
  loadGalleryImages,
} from "../../../lib/storage";

describe("Gallery", () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it("shows the empty state and both add buttons", async () => {
    await renderGallery();
    expect(screen.getAllByText("Add images")).toHaveLength(2);
    expect(screen.getByText("or paste with Ctrl+V")).toBeInTheDocument();
  });

  it("adds an image from the file input", async () => {
    await renderGallery();
    await addImages(imageFile());
    expect(screen.getByAltText("shot.png")).toBeInTheDocument();
  });

  it("ignores files that are not images", async () => {
    await renderGallery();
    const text = new File(["hello"], "note.txt", { type: "text/plain" });
    fireEvent.change(fileInput(), { target: { files: [text] } });
    expect(screen.getByText("No images yet")).toBeInTheDocument();
  });

  it("adds an image pasted from the clipboard", async () => {
    await renderGallery();
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", {
      value: { files: [imageFile("pasted.png")] },
    });
    fireEvent(window, event);
    expect(await screen.findByAltText("pasted.png")).toBeInTheDocument();
  });

  it("deletes an image after confirming", async () => {
    await renderGallery();
    await addImages(imageFile());
    fireEvent.click(await screen.findByLabelText("Delete shot.png"));
    expect(await screen.findByText("Delete this image?")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Delete"));
    expect(await screen.findByText("No images yet")).toBeInTheDocument();
  });

  it("keeps the image when the delete dialog is cancelled", async () => {
    await renderGallery();
    await addImages(imageFile());
    fireEvent.click(await screen.findByLabelText("Delete shot.png"));
    fireEvent.click(await screen.findByText("Cancel"));
    expect(screen.getByAltText("shot.png")).toBeInTheDocument();
  });

  it("hides the delete all button when the gallery is empty", async () => {
    await renderGallery();
    expect(
      screen.queryByLabelText("Delete all images"),
    ).not.toBeInTheDocument();
  });

  it("deletes every image after confirming", async () => {
    await renderGallery();
    await addImages(imageFile("one.png"), imageFile("two.png"));
    fireEvent.click(screen.getByLabelText("Delete all images"));
    expect(
      await screen.findByText("Delete all images? This cannot be undone."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("Delete"));
    expect(await screen.findByText("No images yet")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Delete all images"),
    ).not.toBeInTheDocument();
  });

  it("keeps every image when delete all is cancelled", async () => {
    await renderGallery();
    await addImages(imageFile("one.png"), imageFile("two.png"));
    fireEvent.click(screen.getByLabelText("Delete all images"));
    fireEvent.click(await screen.findByText("Cancel"));
    expect(screen.getByAltText("one.png")).toBeInTheDocument();
    expect(screen.getByAltText("two.png")).toBeInTheDocument();
  });

  it("resets the gallery in storage after delete all", async () => {
    await renderGallery();
    await addImages(imageFile());
    fireEvent.click(screen.getByLabelText("Delete all images"));
    fireEvent.click(await screen.findByText("Delete"));
    await screen.findByText("No images yet");
    await initStorage();
    expect(initialGalleryManifest()).toEqual(defaultGalleryManifest());
  });

  it("persists images to indexeddb", async () => {
    await renderGallery();
    await addImages(imageFile());
    await initStorage();
    expect(initialGalleryManifest().ids).toHaveLength(1);
    const stored = await loadGalleryImages(initialGalleryManifest().ids);
    expect(stored[0].dataUrl).toBe(PNG);
  });

  it("puts newly added images above the existing ones", async () => {
    await renderGallery();
    await addImages(imageFile("one.png"), imageFile("two.png"));
    await addImages(imageFile("new.png"));
    const order = screen
      .getAllByRole("img")
      .map((element) => element.getAttribute("alt"));
    expect(order).toEqual(["new.png", "one.png", "two.png"]);
  });

  it("scrolls back to the top after adding images", async () => {
    const { container } = await renderGallery();
    const scroller = container.querySelector(
      ".editor-scroll",
    ) as HTMLDivElement;
    scroller.scrollTop = 120;
    await addImages(imageFile());
    expect(scroller.scrollTop).toBe(0);
  });

  it("shows how many images are loaded out of the total", async () => {
    await renderSeededGallery(5);
    expect(screen.getByText("Showing 0 of 5")).toBeInTheDocument();
    expect(screen.getByText("Load more")).toBeInTheDocument();
  });

  it("loads images in pages as the gallery already has them", async () => {
    const count = await renderSeededGallery(5);
    fireEvent.click(screen.getByText("Load more"));
    await screen.findByAltText("seed-4.png");
    expect(screen.getAllByRole("img")).toHaveLength(count);
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
    expect(screen.queryByText("Load more")).not.toBeInTheDocument();
  });

  it("adds a batch of images at once without paging", async () => {
    await renderGallery();
    fireEvent.change(fileInput(), {
      target: {
        files: Array.from({ length: 12 }, (_, index) =>
          imageFile(`batch-${index}.png`),
        ),
      },
    });
    await screen.findByAltText("batch-11.png");
    expect(screen.getAllByRole("img")).toHaveLength(12);
  });
});
