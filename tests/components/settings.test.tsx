import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Settings from "../../components/settings";
import { clearAllData } from "../../lib/storage";

describe("Settings", () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it("opens the settings modal", async () => {
    render(<Settings />);
    fireEvent.click(await screen.findByLabelText("Settings"));
    expect(await screen.findByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Accent color")).toBeInTheDocument();
  });

  it("persists the font choice", async () => {
    render(<Settings />);
    fireEvent.click(await screen.findByLabelText("Settings"));
    await screen.findByText("Accent color");
    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "sans" },
    });
    fireEvent.click(screen.getByText("Save"));
    const settings = JSON.parse(localStorage.getItem("duhlupa-settings")!);
    expect(settings.fontFamily).toBe("sans");
  });

  it("exports data", async () => {
    const createObjectURL = vi.fn(() => "blob:url");
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL: vi.fn(),
    });
    render(<Settings />);
    fireEvent.click(await screen.findByLabelText("Settings"));
    fireEvent.click(await screen.findByText("Export data"));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
