import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import TableNameModal from "../../../components/table/table-name-modal";

describe("TableNameModal", () => {
  it("submits the entered name", () => {
    const onSubmit = vi.fn();
    render(<TableNameModal onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("Table name..."), {
      target: { value: "Sales" },
    });
    fireEvent.click(screen.getByText("Submit"));
    expect(onSubmit).toHaveBeenCalledWith("Sales");
  });

  it("falls back to Untitled when empty", () => {
    const onSubmit = vi.fn();
    render(<TableNameModal onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.click(screen.getByText("Submit"));
    expect(onSubmit).toHaveBeenCalledWith("Untitled");
  });

  it("submits on Enter", () => {
    const onSubmit = vi.fn();
    render(<TableNameModal onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("Table name..."), {
      target: { value: "Notes" },
    });
    fireEvent.keyDown(screen.getByPlaceholderText("Table name..."), {
      key: "Enter",
    });
    expect(onSubmit).toHaveBeenCalledWith("Notes");
  });
});
