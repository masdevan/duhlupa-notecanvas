import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as XLSX from "xlsx";
import TableGrid from "../../../components/table/table-grid";

const table = {
  id: 1,
  name: "Data",
  columns: ["Name", "Note"],
  colWidths: [200, 300],
  rows: [
    ["Alice", "short"],
    ["Bob", "x".repeat(80)],
  ],
};

const handlers = {
  onRenameColumn: vi.fn(),
  onAddColumn: vi.fn(),
  onAddRow: vi.fn(),
  onRemoveRow: vi.fn(),
  onRemoveColumn: vi.fn(),
  onResizeColumn: vi.fn(),
  onUpdateCell: vi.fn(),
  onImportData: vi.fn(),
};

function renderGrid(overrides: Partial<typeof handlers> = {}) {
  return render(<TableGrid table={table} {...handlers} {...overrides} />);
}

describe("TableGrid", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders columns, rows, and toolbar", () => {
    renderGrid();
    expect(screen.getByDisplayValue("Name")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
    expect(screen.getByText("Add column")).toBeInTheDocument();
    expect(screen.getByText("Add row")).toBeInTheDocument();
    expect(screen.getByText("No wrap")).toBeInTheDocument();
  });

  it("adds a column and a row", () => {
    renderGrid();
    fireEvent.click(screen.getByText("Add column"));
    expect(handlers.onAddColumn).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("Add row"));
    expect(handlers.onAddRow).toHaveBeenCalledTimes(1);
  });

  it("renames a column and auto-fits its width", () => {
    renderGrid();
    fireEvent.change(screen.getByDisplayValue("Name"), {
      target: { value: "A very very long column name" },
    });
    expect(handlers.onRenameColumn).toHaveBeenCalledWith(
      0,
      "A very very long column name",
    );
    expect(handlers.onResizeColumn).toHaveBeenCalledWith(0, expect.any(Number));
  });

  it("expands an overflowing cell on double click", () => {
    renderGrid();
    const longCell = screen.getByDisplayValue("x".repeat(80));
    fireEvent.doubleClick(longCell.closest("td")!);
    expect(screen.getByDisplayValue("x".repeat(80)).tagName).toBe("TEXTAREA");
  });

  it("does not expand a short cell", () => {
    renderGrid();
    const shortCell = screen.getByDisplayValue("short");
    fireEvent.doubleClick(shortCell.closest("td")!);
    expect(screen.getByDisplayValue("short").tagName).toBe("INPUT");
  });

  it("persists the wrap toggle", () => {
    renderGrid();
    fireEvent.click(screen.getByText("No wrap"));
    expect(localStorage.getItem("duhlupa-wrap")).toBe("1");
    expect(screen.getByText("Wrap on")).toBeInTheDocument();
  });

  it("deletes a column via right-click menu", () => {
    renderGrid();
    fireEvent.contextMenu(screen.getByDisplayValue("Name").closest("th")!);
    fireEvent.click(screen.getByText("Delete column"));
    expect(handlers.onRemoveColumn).toHaveBeenCalledWith(0);
  });

  it("imports xlsx data", async () => {
    const onImportData = vi.fn();
    const { container } = renderGrid({ onImportData });
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet([
        ["A", "B"],
        ["1", "2"],
      ]),
      "Sheet1",
    );
    const buffer = XLSX.write(book, { type: "array", bookType: "xlsx" });
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File([buffer], "data.xlsx")] },
    });
    await waitFor(() =>
      expect(onImportData).toHaveBeenCalledWith(["A", "B"], [["1", "2"]]),
    );
  });
});
