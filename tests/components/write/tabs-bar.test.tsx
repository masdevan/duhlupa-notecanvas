import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import TabsBar from "../../../components/write/tabs-bar";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: Record<string, unknown>) => (
    <a {...props}>{children as React.ReactNode}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("TabsBar", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the default tab and editor", () => {
    render(<TabsBar />);
    expect(screen.getByText("Untitled")).toBeInTheDocument();
    expect(screen.getByLabelText("Note content")).toBeInTheDocument();
  });

  it("adds a tab", () => {
    render(<TabsBar />);
    fireEvent.click(screen.getByLabelText("New tab"));
    expect(screen.getAllByText(/Untitled/).length).toBeGreaterThan(1);
  });

  it("derives the tab title from the first line", () => {
    render(<TabsBar />);
    fireEvent.change(screen.getByLabelText("Note content"), {
      target: { value: "My first line\nrest" },
    });
    expect(screen.getByText("My first line")).toBeInTheDocument();
  });

  it("persists state to localStorage", () => {
    render(<TabsBar />);
    fireEvent.change(screen.getByLabelText("Note content"), {
      target: { value: "saved" },
    });
    const stored = JSON.parse(localStorage.getItem("duhlupa-tabs")!);
    expect(stored.tabs[0].content).toBe("saved");
  });
});
