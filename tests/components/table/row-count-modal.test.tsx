import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import RowCountModal from "../../../components/table/row-count-modal";

describe("RowCountModal", () => {
  it("adds the entered row count", () => {
    const onAdd = vi.fn();
    render(<RowCountModal onAdd={onAdd} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("Number of rows"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByText("Add"));
    expect(onAdd).toHaveBeenCalledWith(10);
  });

  it("clamps the count to 100", () => {
    const onAdd = vi.fn();
    render(<RowCountModal onAdd={onAdd} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("Number of rows"), {
      target: { value: "500" },
    });
    fireEvent.click(screen.getByText("Add"));
    expect(onAdd).toHaveBeenCalledWith(100);
  });

  it("ignores invalid input", () => {
    const onAdd = vi.fn();
    render(<RowCountModal onAdd={onAdd} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("Number of rows"), {
      target: { value: "abc" },
    });
    fireEvent.click(screen.getByText("Add"));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("cancels", () => {
    const onCancel = vi.fn();
    render(<RowCountModal onAdd={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
