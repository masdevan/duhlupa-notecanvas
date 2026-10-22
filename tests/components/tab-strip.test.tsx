import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
    onReorder: vi.fn(),
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
      onReorder={handlers.onReorder}
      reorderable={Boolean(overrides.reorderable)}
    />,
  );
  return handlers;
}

function getTabElement(title: string) {
  return screen.getByText(title).closest("[data-tab-id]") as HTMLElement;
}

function mockTabRects() {
  [getTabElement("First note"), getTabElement("Second")].forEach(
    (element, index) => {
      element.getBoundingClientRect = () => ({
        x: index * 160,
        y: 0,
        width: 160,
        height: 36,
        top: 0,
        right: index * 160 + 160,
        bottom: 36,
        left: index * 160,
        toJSON: () => ({}),
      });
    },
  );
}

function mockPointerCapture() {
  const strip = document.querySelector(".tab-strip") as HTMLElement;
  const capture = vi.fn();
  Object.defineProperty(strip, "setPointerCapture", {
    value: capture,
    configurable: true,
  });
  return capture;
}

afterEach(() => {
  vi.useRealTimers();
});

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

  it("selects a tab after a normal press and release", () => {
    const handlers = renderStrip({ reorderable: true });
    const firstTab = getTabElement("First note");

    fireEvent.pointerDown(firstTab, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 20,
      clientY: 10,
      button: 0,
    });
    fireEvent.pointerUp(firstTab, {
      pointerId: 1,
      clientX: 20,
      clientY: 10,
    });
    fireEvent.click(firstTab);

    expect(handlers.onSelect).toHaveBeenCalledWith(1);
  });

  it("starts dragging after crossing the horizontal threshold", () => {
    renderStrip({ reorderable: true });
    const capture = mockPointerCapture();
    const firstTab = getTabElement("First note");

    fireEvent.pointerDown(firstTab, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 20,
      clientY: 10,
      button: 0,
    });
    fireEvent.pointerMove(firstTab, {
      pointerId: 1,
      clientX: 30,
      clientY: 10,
    });

    expect(capture).toHaveBeenCalledWith(1);
  });

  it("does not start dragging below the threshold", () => {
    renderStrip({ reorderable: true });
    const capture = mockPointerCapture();
    const firstTab = getTabElement("First note");

    fireEvent.pointerDown(firstTab, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 20,
      clientY: 10,
      button: 0,
    });
    fireEvent.pointerMove(firstTab, {
      pointerId: 1,
      clientX: 26,
      clientY: 10,
    });

    expect(capture).not.toHaveBeenCalled();
  });

  it("does not start dragging on vertical movement", () => {
    renderStrip({ reorderable: true });
    const capture = mockPointerCapture();
    const firstTab = getTabElement("First note");

    fireEvent.pointerDown(firstTab, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 20,
      clientY: 10,
      button: 0,
    });
    fireEvent.pointerMove(firstTab, {
      pointerId: 1,
      clientX: 20,
      clientY: 40,
    });

    expect(capture).not.toHaveBeenCalled();
  });

  it("reorders tabs immediately while dragging", () => {
    const handlers = renderStrip({ reorderable: true });
    mockTabRects();
    const firstTab = getTabElement("First note");

    fireEvent.pointerDown(firstTab, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 20,
      clientY: 10,
      button: 0,
    });
    fireEvent.pointerMove(firstTab, {
      pointerId: 1,
      clientX: 220,
      clientY: 10,
    });
    fireEvent.pointerUp(firstTab, {
      pointerId: 1,
      clientX: 220,
      clientY: 10,
    });

    expect(handlers.onReorder).toHaveBeenCalledWith([2, 1]);
  });

  it("does not reorder when a touch swipes horizontally", () => {
    const handlers = renderStrip({ reorderable: true });
    const capture = mockPointerCapture();
    mockTabRects();
    const firstTab = getTabElement("First note");

    fireEvent.pointerDown(firstTab, {
      pointerId: 3,
      pointerType: "touch",
      clientX: 20,
      clientY: 10,
      button: 0,
    });
    fireEvent.pointerMove(firstTab, {
      pointerId: 3,
      pointerType: "touch",
      clientX: 40,
      clientY: 10,
    });
    fireEvent.pointerUp(firstTab, {
      pointerId: 3,
      pointerType: "touch",
      clientX: 40,
      clientY: 10,
    });

    expect(capture).not.toHaveBeenCalled();
    expect(handlers.onReorder).not.toHaveBeenCalled();
  });

  it("reorders after a short touch hold", () => {
    vi.useFakeTimers();
    const handlers = renderStrip({ reorderable: true });
    mockTabRects();
    const firstTab = getTabElement("First note");

    fireEvent.pointerDown(firstTab, {
      pointerId: 3,
      pointerType: "touch",
      clientX: 20,
      clientY: 10,
      button: 0,
    });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    fireEvent.pointerMove(firstTab, {
      pointerId: 3,
      pointerType: "touch",
      clientX: 220,
      clientY: 10,
    });
    fireEvent.pointerUp(firstTab, {
      pointerId: 3,
      pointerType: "touch",
      clientX: 220,
      clientY: 10,
    });

    expect(handlers.onReorder).toHaveBeenCalledWith([2, 1]);
  });

  it("selects a tab after a short touch tap", () => {
    const handlers = renderStrip({ reorderable: true });
    const firstTab = getTabElement("First note");

    fireEvent.pointerDown(firstTab, {
      pointerId: 3,
      pointerType: "touch",
      clientX: 20,
      clientY: 10,
      button: 0,
    });
    fireEvent.pointerUp(firstTab, {
      pointerId: 3,
      pointerType: "touch",
      clientX: 20,
      clientY: 10,
    });
    fireEvent.click(firstTab);

    expect(handlers.onSelect).toHaveBeenCalledWith(1);
  });

  it("does not reorder when reordering is disabled", () => {
    const handlers = renderStrip();
    mockTabRects();
    const firstTab = getTabElement("First note");

    fireEvent.pointerDown(firstTab, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 20,
      clientY: 10,
      button: 0,
    });
    fireEvent.pointerMove(firstTab, {
      pointerId: 1,
      clientX: 220,
      clientY: 10,
    });
    fireEvent.pointerUp(firstTab, {
      pointerId: 1,
      clientX: 220,
      clientY: 10,
    });

    expect(handlers.onReorder).not.toHaveBeenCalled();
  });
});
