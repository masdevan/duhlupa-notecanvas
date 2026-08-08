import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import TableView from "../../../components/table/table-view";

describe("TableView", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the default table with one column and one row", () => {
    render(<TableView />);
    expect(screen.getByDisplayValue("Column 1")).toBeInTheDocument();
    expect(screen.getByText("Add column")).toBeInTheDocument();
  });

  it("adds a column", () => {
    render(<TableView />);
    fireEvent.click(screen.getByText("Add column"));
    expect(screen.getByDisplayValue("Column 2")).toBeInTheDocument();
  });

  it("edits a cell", () => {
    render(<TableView />);
    const cell = screen.getAllByRole("textbox")[1];
    fireEvent.change(cell, { target: { value: "hello" } });
    expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
  });

  it("renames the table via double click on the tab", () => {
    render(<TableView />);
    const tab = screen.getByText("Untitled");
    fireEvent.doubleClick(tab);
    const input = screen.getByDisplayValue("Untitled");
    fireEvent.change(input, { target: { value: "Renamed" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("Renamed")).toBeInTheDocument();
  });

  it("persists changes to localStorage", () => {
    render(<TableView />);
    fireEvent.click(screen.getByText("Add column"));
    const stored = JSON.parse(localStorage.getItem("duhlupa-tables")!);
    expect(stored.tables[0].columns).toEqual(["Column 1", "Column 2"]);
  });
});
