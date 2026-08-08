import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SettingsButton from "../../components/settings-button";

describe("SettingsButton", () => {
  it("fires onOpen when clicked", () => {
    const onOpen = vi.fn();
    render(<SettingsButton onOpen={onOpen} />);
    fireEvent.click(screen.getByLabelText("Settings"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
