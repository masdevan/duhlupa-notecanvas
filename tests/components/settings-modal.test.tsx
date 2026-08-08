import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SettingsModal from "../../components/settings-modal";
import type { AppState } from "../../lib/types";

const props = {
  accentColor: "#39bff3",
  textColor: "#f5f5f5",
  fontFamily: "mono",
  letterSpacing: -0.5,
  contentPosition: "left" as const,
  onSaveColors: vi.fn(),
  onFontChange: vi.fn(),
  onLetterSpacingChange: vi.fn(),
  onPositionChange: vi.fn(),
  onResetAll: vi.fn(),
  onClearAll: vi.fn(),
  onExport: vi.fn(),
  onImport: vi.fn(),
  onClose: vi.fn(),
};

function fileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

const backup: AppState = {
  tabs: [{ id: 1, content: "hi" }],
  activeId: 1,
  counter: 1,
  wrapWidth: null,
  accentColor: "#39bff3",
  textColor: "#f5f5f5",
  fontFamily: "mono",
  letterSpacing: -0.5,
  contentPosition: "left",
};

describe("SettingsModal", () => {
  it("renders settings options", () => {
    render(<SettingsModal {...props} />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Accent color")).toBeInTheDocument();
    expect(screen.getByText("Text color")).toBeInTheDocument();
    expect(screen.getByText("Font")).toBeInTheDocument();
  });

  it("saves font changes", () => {
    render(<SettingsModal {...props} />);
    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "sans" },
    });
    fireEvent.click(screen.getByText("Save"));
    expect(props.onFontChange).toHaveBeenCalledWith("sans");
    expect(props.onSaveColors).toHaveBeenCalled();
    expect(props.onLetterSpacingChange).toHaveBeenCalled();
    expect(props.onPositionChange).toHaveBeenCalled();
  });

  it("shows an error for an invalid backup file", async () => {
    const { container } = render(<SettingsModal {...props} />);
    fireEvent.change(fileInput(container), {
      target: { files: [new File(["not json"], "backup.json")] },
    });
    await waitFor(() =>
      expect(screen.getByText("Invalid backup file.")).toBeInTheDocument(),
    );
  });

  it("imports a valid backup file", async () => {
    const onImport = vi.fn();
    const { container } = render(
      <SettingsModal {...props} onImport={onImport} />,
    );
    fireEvent.change(fileInput(container), {
      target: { files: [new File([JSON.stringify(backup)], "backup.json")] },
    });
    await waitFor(() => expect(onImport).toHaveBeenCalledWith(backup));
  });

  it("opens reset confirmation and resets on confirm", () => {
    render(<SettingsModal {...props} />);
    fireEvent.click(screen.getByText("Reset"));
    expect(
      screen.getByText("Reset all settings to default?"),
    ).toBeInTheDocument();
    const resetButtons = screen.getAllByText("Reset");
    fireEvent.click(resetButtons[resetButtons.length - 1]);
    expect(props.onResetAll).toHaveBeenCalled();
  });

  it("opens clear-all confirmation and clears on confirm", () => {
    render(<SettingsModal {...props} />);
    fireEvent.click(screen.getByText("Clear all data"));
    expect(
      screen.getByText("Clear all data? This cannot be undone."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("Clear"));
    expect(props.onClearAll).toHaveBeenCalled();
  });
});
