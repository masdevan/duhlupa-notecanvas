import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Settings from "../../components/settings";

describe("Settings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("opens the settings modal", () => {
    render(<Settings />);
    fireEvent.click(screen.getByLabelText("Settings"));
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Accent color")).toBeInTheDocument();
  });

  it("persists the font choice", () => {
    render(<Settings />);
    fireEvent.click(screen.getByLabelText("Settings"));
    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "sans" },
    });
    fireEvent.click(screen.getByText("Save"));
    const stored = JSON.parse(localStorage.getItem("duhlupa-tabs")!);
    expect(stored.fontFamily).toBe("sans");
  });

  it("exports data", () => {
    const createObjectURL = vi.fn(() => "blob:url");
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL: vi.fn(),
    });
    render(<Settings />);
    fireEvent.click(screen.getByLabelText("Settings"));
    fireEvent.click(screen.getByText("Export data"));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
