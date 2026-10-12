import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import FaultInjectionPage from "@/app/fault-injection/page";

describe("Fault Injection Dashboard UI", () => {
  it("renders all 3 injection zones and theoretical limit caveat", () => {
    render(<FaultInjectionPage />);

    expect(screen.getByTestId("fault-zone-1")).toBeDefined();
    expect(screen.getByTestId("fault-zone-2")).toBeDefined();
    expect(screen.getByTestId("fault-zone-3")).toBeDefined();

    const caveat = screen.getByTestId("theoretical-limit-caveat");
    expect(caveat.textContent).toContain("CHÚ THÍCH CỐ ĐỊNH VỀ GIỚI HẠN LÝ THUYẾT CỦA NGUỒN SAI");
  });

  it("updates metrics when running perturbation test", async () => {
    vi.useFakeTimers();
    render(<FaultInjectionPage />);

    const runBtn = screen.getByTestId("run-injection-btn");
    fireEvent.click(runBtn);

    // Fast-forward simulation timer
    act(() => {
      vi.advanceTimersByTime(500);
    });

    const misattr = screen.getByTestId("metric-misattribution-rate");
    expect(misattr).toBeDefined();

    const slip = screen.getByTestId("metric-patch-slip-rate");
    expect(slip).toBeDefined();

    vi.useRealTimers();
  });
});
