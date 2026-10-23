/**
 * src/features/backend/run-state.ts — Wire types and event reducer for spec_gate_backend runs
 *
 * Requirements:
 *   - Mirror the backend JSON (camelCase manifest, SSE event names).
 *   - Fold the SSE stream into one view state; pure, so it is unit-tested without a server.
 */

export const BACKEND_API = "/api/backend";

export const PIPELINE_STEPS = ["setup", "admit", "run"] as const;
type PipelineStep = (typeof PIPELINE_STEPS)[number];
export type StepStatus = "pending" | "running" | "done" | "failed";

type BackendRunStatus = "pending" | PipelineStep | "done" | "failed";

export interface BackendRunManifest {
  id: string;
  datasetId: string;
  seed: string;
  heldOutRatio: number;
  totalTasks: number;
  runTaskIds: string[];
  heldOutTaskIds: string[];
  isHeldOutLocked: boolean;
  activeMonitorVersion: string;
  status: BackendRunStatus;
  createdAt: string;
}

/** One line of an ADOM events.jsonl, forwarded as the `adom_event` SSE event. */
interface AdomEvent {
  run_id: string;
  task_id: string;
  phase: string;
  event: string;
  timestamp: string;
  monitor_version: number;
  [extra: string]: unknown;
}

export const BACKEND_EVENT_NAMES = [
  "run_created",
  "step_started",
  "step_done",
  "run_done",
  "run_failed",
  "adom_event",
] as const;
export type BackendEventName = (typeof BACKEND_EVENT_NAMES)[number];

export interface BackendRunView {
  steps: Record<PipelineStep, StepStatus>;
  finished: boolean;
  failure: { step: string | null; message: string } | null;
  adomCount: number;
  /** "phase · event" -> count */
  adomCounts: Record<string, number>;
  /** Most recent ADOM events, newest last. */
  recent: AdomEvent[];
}

export const RECENT_LIMIT = 50;

export function initialRunView(): BackendRunView {
  return {
    steps: { setup: "pending", admit: "pending", run: "pending" },
    finished: false,
    failure: null,
    adomCount: 0,
    adomCounts: {},
    recent: [],
  };
}

function isStep(value: unknown): value is PipelineStep {
  return typeof value === "string" && (PIPELINE_STEPS as readonly string[]).includes(value);
}

export function reduceRunEvent(
  view: BackendRunView,
  name: BackendEventName,
  data: Record<string, unknown>
): BackendRunView {
  switch (name) {
    case "step_started":
    case "step_done": {
      if (!isStep(data.step)) return view;
      const status: StepStatus = name === "step_started" ? "running" : "done";
      return { ...view, steps: { ...view.steps, [data.step]: status } };
    }
    case "run_done":
      return { ...view, finished: true };
    case "run_failed": {
      const step = typeof data.step === "string" ? data.step : null;
      const steps = isStep(step) ? { ...view.steps, [step]: "failed" as const } : view.steps;
      return { ...view, steps, finished: true, failure: { step, message: String(data.message ?? "") } };
    }
    case "adom_event": {
      const ev = data as unknown as AdomEvent;
      const key = `${ev.phase} · ${ev.event}`;
      return {
        ...view,
        adomCount: view.adomCount + 1,
        adomCounts: { ...view.adomCounts, [key]: (view.adomCounts[key] ?? 0) + 1 },
        recent: [...view.recent, ev].slice(-RECENT_LIMIT),
      };
    }
    default:
      return view;
  }
}
