import type { Verdict as DomainVerdict } from "@/core/types";

export type EvalVerdict = "CODE_FAULT" | "SPEC_FAULT" | "UNKNOWN" | DomainVerdict;
export type RunStatus = "queued" | "spec_running" | "code_running" | "judging" | "answered" | "followup" | "final" | "error";
export interface AgentOutput { agent: string; model?: string; version?: string; status: "queued" | "running" | "done" | "error"; output?: string; latencyMs?: number; tokens?: number; error?: string }
export interface Turn { id: string; role: "user" | "system"; content: string; verdict?: EvalVerdict; confidence?: number; latencyMs?: number; at: string }
export interface RunLog { id: string; at: string; level: "info" | "warn" | "error"; message: string }
export interface Run {
  run_id: string; created_at: string; updated_at: string;
  dataset: { id: string; version: string }; problem_id: string; problem: string;
  spec?: AgentOutput; code?: AgentOutput; turns: Turn[]; verdicts: EvalVerdict[];
  confidence?: number; latency: Record<string, number>; gold_label?: EvalVerdict;
  logs?: RunLog[];
  status: RunStatus; review?: { agree: boolean; note: string; at: string };
}
export interface Metrics { totalRuns: number; byVerdict: Record<string, number>; accuracy?: number; averageConfidence?: number; latency: { mean?: number; p50?: number; p95?: number }; followupsUsed: number; unknownResolvedRate?: number }
