/**
 * src/core/stream-types.ts — Dual-Oracle Monitoring NDJSON Stream Event Schema
 *
 * Requirements:
 *   - Type definitions shared between client and server
 *   - Step lifecycle: pending -> running -> done / error
 *   - Fail-closed invariant & Single-Shot Human Query support
 */
import type { Verdict, RuleId } from "./types";

export type StreamStepId =
  | "load_task"
  | "run_code"
  | "oracle_p0"
  | "oracle_code"
  | "adjudicate"
  | "fail_closed_check";

export type StreamStepStatus = "pending" | "running" | "done" | "error";

export interface StreamStepEvent {
  type: "step";
  id: StreamStepId;
  status: StreamStepStatus;
  label: string;
  durationMs?: number;
  data?: {
    c?: unknown;
    w?: unknown;
    accepted?: boolean;
    violated?: string;
    rule?: RuleId;
    verdict?: Verdict;
    details?: string;
  };
}

export interface StreamTextEvent {
  type: "text";
  delta: string;
}

export interface StreamHumanQueryEvent {
  type: "human_query";
  reason: "UND_E" | "UND_C" | "UND_G";
  promptText: string;
  questionType: "acceptability" | "expected-output";
}

export interface StreamDoneEvent {
  type: "done";
  verdict: Verdict;
  totalMs: number;
}

export interface StreamErrorEvent {
  type: "error";
  message: string;
  step?: StreamStepId;
}

export type DualOracleStreamEvent =
  | StreamStepEvent
  | StreamTextEvent
  | StreamHumanQueryEvent
  | StreamDoneEvent
  | StreamErrorEvent;

export interface StreamStepState {
  id: StreamStepId;
  label: string;
  status: StreamStepStatus;
  durationMs?: number;
  data?: StreamStepEvent["data"];
  error?: string;
}
