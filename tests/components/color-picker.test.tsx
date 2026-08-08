import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ColorPicker from "../../components/color-picker";

describe("ColorPicker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the close button", () => {
    render(
      <ColorPicker
        accentColor="#39bff3"
        defaultColor="#39bff3"
        onAccentColorChange={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByLabelText("Close color picker")).toBeInTheDocument();
  });

  it("resets to the default color", () => {
    const onChange = vi.fn();
    render(
      <ColorPicker
        accentColor="#123456"
        defaultColor="#39bff3"
        onAccentColorChange={onChange}
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByText("Reset"));
    expect(onChange).toHaveBeenLastCalledWith("#39bff3");
  });

  it("closes after save", () => {
    const onClose = vi.fn();
    render(
      <ColorPicker
        accentColor="#39bff3"
        defaultColor="#39bff3"
        onAccentColorChange={() => {}}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByText("Save"));
    vi.runAllTimers();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
