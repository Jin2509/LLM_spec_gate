import { describe, expect, it } from "vitest";
import {
  RECENT_LIMIT,
  initialRunView,
  reduceRunEvent,
  type BackendEventName,
  type BackendRunView,
} from "@/features/backend/run-state";

function fold(events: [BackendEventName, Record<string, unknown>][]): BackendRunView {
  return events.reduce((view, [name, data]) => reduceRunEvent(view, name, data), initialRunView());
}

const adom = (i: number) => ({
  run_id: "r",
  task_id: "HumanEval/53",
  phase: "online",
  event: i % 2 ? "PASS" : "VERDICT",
  timestamp: `t${i}`,
  monitor_version: 0,
});

describe("reduceRunEvent", () => {
  it("tracks each pipeline step from started to done", () => {
    const view = fold([
      ["step_started", { step: "setup" }],
      ["step_done", { step: "setup" }],
      ["step_started", { step: "admit" }],
    ]);
    expect(view.steps).toEqual({ setup: "done", admit: "running", run: "pending" });
    expect(view.finished).toBe(false);
  });

  it("marks the failing step and keeps the pipeline message", () => {
    const view = fold([
      ["step_started", { step: "setup" }],
      ["run_failed", { step: "setup", message: "setup: 0 tasks ready" }],
    ]);
    expect(view.steps.setup).toBe("failed");
    expect(view.finished).toBe(true);
    expect(view.failure).toEqual({ step: "setup", message: "setup: 0 tasks ready" });
  });

  it("counts ADOM events by phase and event and keeps only the latest ones", () => {
    const events = Array.from({ length: RECENT_LIMIT + 5 }, (_, i) => ["adom_event", adom(i)] as [BackendEventName, Record<string, unknown>]);
    const view = fold(events);
    expect(view.adomCount).toBe(RECENT_LIMIT + 5);
    expect(view.adomCounts["online · PASS"]! + view.adomCounts["online · VERDICT"]!).toBe(RECENT_LIMIT + 5);
    expect(view.recent).toHaveLength(RECENT_LIMIT);
    expect(view.recent.at(-1)?.timestamp).toBe(`t${RECENT_LIMIT + 4}`);
  });

  it("ignores a step name it does not know", () => {
    expect(reduceRunEvent(initialRunView(), "step_started", { step: "deploy" })).toEqual(initialRunView());
  });

  it("ends the run on run_done", () => {
    expect(fold([["run_done", {}]]).finished).toBe(true);
  });
});
