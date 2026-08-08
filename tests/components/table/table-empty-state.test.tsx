import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import TableEmptyState from "../../../components/table/table-empty-state";

describe("TableEmptyState", () => {
  it("creates a table with the entered name", () => {
    const onCreate = vi.fn();
    render(<TableEmptyState onCreate={onCreate} />);
    fireEvent.change(screen.getByPlaceholderText("Table name..."), {
      target: { value: "Inventory" },
    });
    fireEvent.click(screen.getByText("Create"));
    expect(onCreate).toHaveBeenCalledWith("Inventory");
  });

  it("creates Untitled when the name is blank", () => {
    const onCreate = vi.fn();
    render(<TableEmptyState onCreate={onCreate} />);
    fireEvent.click(screen.getByText("Create"));
    expect(onCreate).toHaveBeenCalledWith("Untitled");
  });

  it("creates on Enter", () => {
    const onCreate = vi.fn();
    render(<TableEmptyState onCreate={onCreate} />);
    fireEvent.change(screen.getByPlaceholderText("Table name..."), {
      target: { value: "  Spaced  " },
    });
    fireEvent.keyDown(screen.getByPlaceholderText("Table name..."), {
      key: "Enter",
    });
    expect(onCreate).toHaveBeenCalledWith("Spaced");
  });
});
