import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import TabStrip from "../../components/tab-strip";

const tabs = [
  { id: 1, content: "First note\nsecond line" },
  { id: 2, content: "Second" },
];

function renderStrip(overrides: Record<string, unknown> = {}) {
  const handlers = {
    onSelect: vi.fn(),
    onAdd: vi.fn(),
    onClose: vi.fn(),
    onRename: vi.fn(),
    ...overrides,
  };
  render(
    <TabStrip
      tabs={tabs}
      activeId={1}
      onSelect={handlers.onSelect}
      onAdd={handlers.onAdd}
      onClose={handlers.onClose}
      onRename={handlers.onRename}
    />,
  );
  return handlers;
}

describe("TabStrip", () => {
  it("derives tab titles from the first line", () => {
    renderStrip();
    expect(screen.getByText("First note")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("selects a tab on click", () => {
    const handlers = renderStrip();
    fireEvent.click(screen.getByText("Second"));
    expect(handlers.onSelect).toHaveBeenCalledWith(2);
  });

  it("adds a tab via the plus button", () => {
    const handlers = renderStrip();
    fireEvent.click(screen.getByLabelText("New tab"));
    expect(handlers.onAdd).toHaveBeenCalledTimes(1);
  });

  it("closes a tab via its close button", () => {
    const handlers = renderStrip();
    const closeButtons = screen.getAllByLabelText("Close tab");
    fireEvent.click(closeButtons[1]);
    expect(handlers.onClose).toHaveBeenCalledWith(2);
  });
});
