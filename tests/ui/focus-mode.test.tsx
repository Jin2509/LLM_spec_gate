import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AnnotatePage from "@/app/runs/[runId]/annotate/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ runId: "run_evalplus_01" }),
  usePathname: () => "/runs/run_evalplus_01/annotate",
}));

describe("Focus Mode / Annotation Queue", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })
    );
  });

  it("renders Focus Mode layout, hotkeys bar, and progress bar", () => {
    render(<AnnotatePage />);

    expect(screen.getByText("Chế độ tập trung (Focus Mode / Annotation Queue)")).toBeDefined();
    expect(screen.getByText(/Phím tắt:/)).toBeDefined();
    expect(screen.getByText(/Hoãn \(Giữ mở\)/)).toBeDefined();
    expect(screen.getByText(/Không xác định được \(Khóa vĩnh viễn\)/)).toBeDefined();
  });

  it("SHORTCUT S: triggers deferral, keeping ticket OPEN and postponing it", async () => {
    render(<AnnotatePage />);

    // Press 's'
    await act(async () => {
      fireEvent.keyDown(window, { key: "s" });
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/defer"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("SHORTCUT C: marks ticket UNCERTAIN, spending the ticket permanently", async () => {
    render(<AnnotatePage />);

    // Press 'c'
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
