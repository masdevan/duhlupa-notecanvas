import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import IconChevronDown from "../../components/icons/chevron-down";
import IconClose from "../../components/icons/close";
import IconPlus from "../../components/icons/plus";
import IconSettings from "../../components/icons/settings";
import IconTable from "../../components/icons/table";
import IconTrash from "../../components/icons/trash";
import IconWrite from "../../components/icons/write";

const icons = [
  ["chevron-down", IconChevronDown],
  ["close", IconClose],
  ["plus", IconPlus],
  ["settings", IconSettings],
  ["table", IconTable],
  ["trash", IconTrash],
  ["write", IconWrite],
] as const;

describe("icons", () => {
  it.each(icons)("%s renders an svg with aria-hidden", (_name, Icon) => {
    const { container } = render(<Icon />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it.each(icons)("%s respects a custom size", (_name, Icon) => {
    const { container } = render(<Icon size={24} />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "24");
    expect(container.querySelector("svg")).toHaveAttribute("height", "24");
  });
});
