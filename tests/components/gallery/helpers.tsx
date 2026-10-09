import { render, screen, fireEvent } from "@testing-library/react";
import Gallery from "../../../components/gallery/gallery";
import { saveGalleryImages } from "../../../lib/storage";

export const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export function imageFile(name = "shot.png") {
  const bytes = Uint8Array.from(atob(PNG.split(",")[1]), (char) =>
    char.charCodeAt(0),
  );
  return new File([bytes], name, { type: "image/png" });
}

export function fileInput() {
  return document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
}

export function previewImage() {
  return document.querySelector(".fixed img") as HTMLImageElement;
}

export function translateX() {
  return Number(
    previewImage().style.transform.match(/translate\(([-\d.]+)px/)?.[1],
  );
}

export function scale() {
  return Number(
    previewImage().style.transform.match(/scale\(([\d.]+)/)![1],
  );
}

export async function renderGallery() {
  const result = render(<Gallery />);
  await screen.findByText("No images yet");
  return result;
}

export async function addImages(...files: File[]) {
  fireEvent.change(fileInput(), { target: { files } });
  await screen.findByAltText(files[0].name);
}

export async function openPreview(name = "shot.png") {
  await addImages(imageFile(name));
  fireEvent.click(await screen.findByAltText(name));
  return previewImage();
}

export async function renderSeededGallery(count: number) {
  await saveGalleryImages(
    Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      name: `seed-${index}.png`,
      type: "image/png",
      dataUrl: PNG,
    })),
  );
  render(<Gallery />);
  await screen.findByText(`Showing 0 of ${count}`);
  return count;
}
