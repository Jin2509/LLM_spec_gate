import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AnnotatePage from "@/app/runs/[runId]/annotate/page";
import { mockApi } from "../helpers/api-routes";
import { ANNOTATION_QUEUE, RUN_ID, UNKNOWN_CASE } from "../fixtures/api";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ runId: "run_test_01" }),
  usePathname: () => "/runs/run_test_01/annotate",
}));

async function renderWithQueue() {
  render(<AnnotatePage />);
  await screen.findByTestId("query-ticket");
}

describe("Focus Mode / Annotation Queue", () => {
  beforeEach(() => {
    const ticketId = UNKNOWN_CASE.ticket!.id;
    mockApi({
      [`GET /api/runs/${RUN_ID}/annotation-queue`]: ANNOTATION_QUEUE,
      [`POST /api/tickets/${ticketId}/answer`]: { success: true, ticket: { ...UNKNOWN_CASE.ticket, status: "spent" }, message: "ok" },
      [`POST /api/tickets/${ticketId}/defer`]: { success: true, ticketId, status: "open", message: "ok" },
    });
  });

  it("renders Focus Mode layout, hotkeys bar, and progress bar", async () => {
    await renderWithQueue();

    expect(screen.getByText("Chế độ tập trung (Focus Mode / Annotation Queue)")).toBeDefined();
    expect(screen.getByText(/Phím tắt:/)).toBeDefined();
    expect(screen.getByText(/Hoãn \(Giữ mở\)/)).toBeDefined();
    expect(screen.getByText(/Không xác định được \(Khóa vĩnh viễn\)/)).toBeDefined();
  });

  it("SHORTCUT S: triggers deferral, keeping ticket OPEN and postponing it", async () => {
    await renderWithQueue();

    await act(async () => {
      fireEvent.keyDown(window, { key: "s" });
    });

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/defer"), expect.objectContaining({ method: "POST" }));
  });

  it("SHORTCUT C: marks ticket UNCERTAIN, spending the ticket permanently", async () => {
    await renderWithQueue();

    await act(async () => {
      fireEvent.keyDown(window, { key: "c" });
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/answer"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"isUncertain":true'),
      })
    );
  });
});
