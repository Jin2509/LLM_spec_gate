import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AdmissionPage from "@/app/runs/[runId]/admission/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ runId: "run_evalplus_01" }),
  usePathname: () => "/runs/run_evalplus_01/admission",
}));

// Mock useRunEvents
vi.mock("@/features/runs/use-run-events", () => ({
  useRunEvents: () => ({
    events: [],
    isConnected: true,
    error: null,
    lastSeq: 8,
  }),
}));

describe("6-Step Admission Checklist UI", () => {
  it("renders all 6 admission checklist steps", () => {
    render(<AdmissionPage />);

    expect(screen.getByText(/1\. Static checker/)).toBeDefined();
    expect(screen.getByText(/2\. Chạy contract/)).toBeDefined();
    expect(screen.getByText(/3\. Kiểm chéo A2\/A3 với anchor closure/)).toBeDefined();
    expect(screen.getByText(/4\. Replay đo SILENT_FAULT/)).toBeDefined();
    expect(screen.getByText(/5\. Z3 kiểm tra A2/)).toBeDefined();
    expect(screen.getByText(/6\. Đo lỏng P0 qua B_synth/)).toBeDefined();
  });

  it("displays anchor violation alert and allows human mark for review", () => {
    render(<AdmissionPage />);

    // Step 3 has anchor violation
    expect(screen.getByText(/Vi phạm tập đóng anchor/)).toBeDefined();

    // Mark for review button is present
    const reviewBtn = screen.getByRole("button", {
      name: /Đánh dấu để người kiểm lại/,
    });
    expect(reviewBtn).toBeDefined();

    // Click mark for review
    fireEvent.click(reviewBtn);

    // State changes to marked
    expect(screen.getByText(/Đã đánh dấu để người kiểm lại/)).toBeDefined();
  });

  it("displays silent fault statistics and looseness metric", () => {
    render(<AdmissionPage />);

    expect(screen.getByText("16.7%")).toBeDefined();
    expect(screen.getByText("2 ca")).toBeDefined();
  });
});
