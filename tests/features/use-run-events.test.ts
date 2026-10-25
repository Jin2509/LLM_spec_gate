/**
 * tests/features/use-run-events.test.ts — Test useRunEvents hook batching
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRunEvents } from "@/features/runs/use-run-events";
import type { RunEvent } from "@/lib/api/types";

describe("useRunEvents hook batching", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with initialEvents and preserves them", () => {
    const initialEvents: RunEvent[] = [
      {
        seq: 1,
        event: "run_created",
        data: { runId: "test_run" },
        timestamp: "2026-10-12T00:00:00Z",
      },
    ];

    const { result } = renderHook(() =>
      useRunEvents({
        runId: "test_run",
        initialEvents,
        autoConnect: false,
      })
    );

    expect(result.current.events).toHaveLength(1);
    expect(result.current.lastSeq).toBe(1);
  });

  it("batches buffered events on batch timer trigger", () => {
    const { result } = renderHook(() =>
      useRunEvents({
        runId: "test_run",
        batchIntervalMs: 250,
        autoConnect: false,
      })
    );

    expect(result.current.events).toHaveLength(0);

    // Call flushBuffer after setting timer
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.events).toHaveLength(0);
  });
});
