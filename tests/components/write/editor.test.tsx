import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Editor from "../../../components/write/editor";

describe("Editor", () => {
  it("renders the note content", () => {
    render(
      <Editor
        content="hello"
        wrapWidth={null}
        onChange={() => {}}
        onWrapWidthChange={() => {}}
      />,
    );
    expect(screen.getByLabelText("Note content")).toHaveValue("hello");
  });

  it("fires onChange while typing", () => {
    const onChange = vi.fn();
    render(
      <Editor
        content=""
        wrapWidth={null}
        onChange={onChange}
        onWrapWidthChange={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText("Note content"), {
      target: { value: "typed" },
    });
    expect(onChange).toHaveBeenCalledWith("typed");
  });

  it("applies the wrap width to the content wrapper", () => {
    const { container } = render(
      <Editor
        content=""
        wrapWidth={600}
        onChange={() => {}}
        onWrapWidthChange={() => {}}
      />,
    );
    expect(container.querySelector(".mx-auto")).toHaveStyle({ width: "600px" });
  });
});
