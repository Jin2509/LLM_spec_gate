import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AdmissionPage from "@/app/runs/[runId]/admission/page";
import { mockApi } from "../helpers/api-routes";
import { ADMISSION_REPORT, RUN_ID } from "../fixtures/api";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ runId: "run_test_01" }),
  usePathname: () => "/runs/run_test_01/admission",
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
  beforeEach(() => {
    mockApi({
      [`GET /api/runs/${RUN_ID}/admission`]: ADMISSION_REPORT,
      [`POST /api/runs/${RUN_ID}/admission/review`]: ({ body }) => ({
        runId: RUN_ID,
        reviewedTaskIds: [(body as { taskId: string }).taskId],
      }),
    });
  });

  it("renders all 6 admission checklist steps", async () => {
    render(<AdmissionPage />);

    expect(await screen.findByText(/1\. Static checker/)).toBeDefined();
    expect(screen.getByText(/2\. Chạy contract/)).toBeDefined();
    expect(screen.getByText(/3\. Kiểm chéo A2\/A3 với anchor closure/)).toBeDefined();
    expect(screen.getByText(/4\. Replay đo SILENT_FAULT/)).toBeDefined();
    expect(screen.getByText(/5\. Z3 kiểm tra A2/)).toBeDefined();
    expect(screen.getByText(/6\. Đo lỏng P0 qua B_synth/)).toBeDefined();
  });

  it("displays anchor violation alert and allows human mark for review", async () => {
    render(<AdmissionPage />);

    // Step 3 has anchor violation
    expect(await screen.findByText(/Vi phạm tập đóng anchor/)).toBeDefined();

    // Mark for review button is present
    const reviewBtn = screen.getByRole("button", {
      name: /Đánh dấu để người kiểm lại/,
    });
    expect(reviewBtn).toBeDefined();

    // Click mark for review
    fireEvent.click(reviewBtn);

    // State changes to marked (persisted via POST /api/runs/:id/admission/review)
    expect(await screen.findByText(/Đã đánh dấu để người kiểm lại/)).toBeDefined();
  });

  it("displays silent fault statistics and looseness metric", async () => {
    render(<AdmissionPage />);

    expect(await screen.findByText("16.7%")).toBeDefined();
    expect(screen.getByText("2 ca")).toBeDefined();
  });
});
