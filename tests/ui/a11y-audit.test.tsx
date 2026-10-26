import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/ui/shell/Sidebar";

vi.mock("next/navigation", () => ({ usePathname: () => "/runs/run_1/evidence" }));

describe("Accessibility & Keyboard Navigation (S15)", () => {
  it("labels the main navigation and marks exactly one current page", () => {
    render(<Sidebar currentRunId="run_1" />);

    const nav = screen.getByRole("navigation", { name: "Điều hướng chính" });
    const current = Array.from(nav.querySelectorAll("a")).filter((a) => a.getAttribute("aria-current") === "page");
    expect(current).toHaveLength(1);
    expect(current[0]!.textContent).toContain("Bằng chứng");
  });

  it("gives the collapse toggle an accessible name and expanded state", () => {
    render(<Sidebar collapsed onToggleCollapsed={vi.fn()} />);
    const toggle = screen.getByRole("button", { name: "Mở rộng thanh bên" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });
});
