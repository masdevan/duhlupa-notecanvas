import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import TabsBar from "../../../components/write/tabs-bar";
import { clearAllData, initStorage, initialState } from "../../../lib/storage";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: Record<string, unknown>) => (
    <a {...props}>{children as React.ReactNode}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("TabsBar", () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it("renders the default tab and editor", async () => {
    render(<TabsBar />);
    expect(await screen.findByText("Untitled")).toBeInTheDocument();
    expect(screen.getByLabelText("Note content")).toBeInTheDocument();
  });

  it("adds a tab", async () => {
    render(<TabsBar />);
    fireEvent.click(await screen.findByLabelText("New tab"));
    expect(screen.getAllByText(/Untitled/).length).toBeGreaterThan(1);
  });

  it("derives the tab title from the first line", async () => {
    render(<TabsBar />);
    fireEvent.change(await screen.findByLabelText("Note content"), {
      target: { value: "My first line\nrest" },
    });
    expect(screen.getByText("My first line")).toBeInTheDocument();
  });

  it("persists state to indexeddb", async () => {
    render(<TabsBar />);
    fireEvent.change(await screen.findByLabelText("Note content"), {
      target: { value: "saved" },
    });
    await initStorage();
    expect(initialState().tabs[0].content).toBe("saved");
  });

  it("asks for confirmation before closing a tab", async () => {
    render(<TabsBar />);
    fireEvent.click(await screen.findByLabelText("New tab"));
    const closeButtons = screen.getAllByLabelText("Close tab");
    fireEvent.click(closeButtons[1]);
    expect(screen.getByText('Delete "Untitled 2"?')).toBeInTheDocument();
    expect(screen.getAllByLabelText("Close tab")).toHaveLength(2);
  });

  it("keeps the tab when deletion is cancelled", async () => {
    render(<TabsBar />);
    fireEvent.click(await screen.findByLabelText("New tab"));
    fireEvent.click(screen.getAllByLabelText("Close tab")[1]);
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.getAllByLabelText("Close tab")).toHaveLength(2);
  });

  it("closes the tab after confirmation", async () => {
    render(<TabsBar />);
    fireEvent.click(await screen.findByLabelText("New tab"));
    fireEvent.click(screen.getAllByLabelText("Close tab")[1]);
    fireEvent.click(screen.getByText("Delete"));
    expect(screen.getAllByLabelText("Close tab")).toHaveLength(1);
  });
});
