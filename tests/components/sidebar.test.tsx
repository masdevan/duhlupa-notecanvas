import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Sidebar from "../../components/sidebar";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: Record<string, unknown>) => (
    <a {...props}>{children as React.ReactNode}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Sidebar", () => {
  it("renders write and table navigation", () => {
    render(<Sidebar />);
    expect(screen.getByLabelText("Write")).toBeInTheDocument();
    expect(screen.getByLabelText("Table")).toBeInTheDocument();
    expect(screen.getAllByAltText("Duhlupa").length).toBeGreaterThan(0);
  });

  it("opens the mobile menu and shows labeled options", () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(screen.getByText("Write")).toBeInTheDocument();
    expect(screen.getByText("Table")).toBeInTheDocument();
  });

  it("closes the mobile menu when clicking outside", () => {
    const { container } = render(<Sidebar />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    const backdrop = container.querySelector(".fixed.inset-0")!;
    fireEvent.click(backdrop);
    expect(screen.queryByText("Write")).not.toBeInTheDocument();
  });
});
