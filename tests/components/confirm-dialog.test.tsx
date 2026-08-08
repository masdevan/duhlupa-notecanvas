import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ConfirmDialog from "../../components/confirm-dialog";

describe("ConfirmDialog", () => {
  it("renders the message and labels", () => {
    render(
      <ConfirmDialog
        message="Delete this table?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText("Delete this table?")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("fires onConfirm and onCancel", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        message="Sure?"
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByText("Yes"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("No"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("closes via backdrop click", () => {
    const onCancel = vi.fn();
    const { container } = render(
      <ConfirmDialog
        message="Sure?"
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(container.querySelector(".modal-backdrop")!);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
