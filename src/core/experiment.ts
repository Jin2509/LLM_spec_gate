/**
 * src/core/experiment.ts — Cấu hình thực nghiệm (schema + kiểu).
 *
 * Ước tính chi phí, kiểm tra cùng họ mô hình và manifest tất định do backend tính (api.md 10.2).
 */
import { z } from "zod";

export const AnchorLevelSchema = z.enum(["A0", "A1", "A2", "A3"]);
/** Chính sách triển khai bản sửa; backend áp dụng, UI chỉ cho chọn. */
export type GatePolicy = "strict" | "standard" | "shadow";

export type AnchorLevel = z.infer<typeof AnchorLevelSchema>;

export const UnknownModeSchema = z.enum(["closed", "open"]);
export type UnknownMode = z.infer<typeof UnknownModeSchema>;

export const HumanOracleModeSchema = z.enum([
  "off",
  "perfect",
  "noise_5",
  "noise_10",
  "real_human",
]);
export type HumanOracleMode = z.infer<typeof HumanOracleModeSchema>;

export interface ExperimentConfig {
  readonly datasetId: string;
  readonly heldOutRatio: number; // Locked held-out partition
  readonly coderModel: string;
  readonly specModel: string;
  readonly anchorLevel: AnchorLevel;
  readonly policy: GatePolicy;
  readonly unknownMode: UnknownMode;
  readonly humanOracle: HumanOracleMode;
  readonly baselines: ReadonlyArray<string>;
  readonly seed: string;
}

export interface CostEstimate {
  readonly functionCalls: number;
  readonly llmDurationSec: number;
  readonly z3DurationSec: number;
  readonly totalTokens: number;
  readonly estimatedUsd: number;
}

export interface ExperimentManifest {
  readonly manifestHash: string;
  readonly config: ExperimentConfig;
  readonly totalTasks: number;
  readonly runTaskCount: number;
  readonly heldOutTaskCount: number;
  readonly initialMonitorVersion: string;
  readonly estimatedCost: CostEstimate;
  readonly partitionChecksum: string;
}
