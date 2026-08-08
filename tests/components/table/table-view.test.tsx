import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import TableView from "../../../components/table/table-view";
import {
  clearAllData,
  initStorage,
  initialTablesState,
} from "../../../lib/storage";

describe("TableView", () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it("renders the default table with one column and one row", async () => {
    render(<TableView />);
    expect(await screen.findByDisplayValue("Column 1")).toBeInTheDocument();
    expect(screen.getByText("Add column")).toBeInTheDocument();
  });

  it("adds a column", async () => {
    render(<TableView />);
    fireEvent.click(await screen.findByText("Add column"));
    expect(await screen.findByDisplayValue("Column 2")).toBeInTheDocument();
  });

  it("edits a cell", async () => {
    render(<TableView />);
    const textboxes = await screen.findAllByRole("textbox");
    fireEvent.change(textboxes[1], { target: { value: "hello" } });
    expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
  });

  it("renames the table via double click on the tab", async () => {
    render(<TableView />);
    const tab = await screen.findByText("Untitled");
    fireEvent.doubleClick(tab);
    const input = screen.getByDisplayValue("Untitled");
    fireEvent.change(input, { target: { value: "Renamed" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("Renamed")).toBeInTheDocument();
  });

  it("persists changes to indexeddb", async () => {
    render(<TableView />);
    fireEvent.click(await screen.findByText("Add column"));
    await initStorage();
    const stored = initialTablesState();
    expect(stored.tables[0].columns).toEqual(["Column 1", "Column 2"]);
  });
});
