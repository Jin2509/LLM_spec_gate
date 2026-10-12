/**
 * src/core/experiment.ts — Pure Formal Experiment Configuration & Deterministic Runner
 *
 * Implements research questions RQ1–RQ6 configuration, cost estimation,
 * and deterministic manifest generation.
 *
 * ZERO React/Next/UI/Mock dependencies.
 */
import { z } from "zod";
import type { GatePolicy } from "./repair";

export const AnchorLevelSchema = z.enum(["A0", "A1", "A2", "A3"]);
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

/**
 * Detects if coder and spec models belong to the same family.
 * Used to raise the "Homogeneous Bias" warning in lab notebooks.
 */
export function checkHomogeneousModelFamily(
  coderModel: string,
  specModel: string
): { isSameFamily: boolean; warning?: string } {
  const getFamily = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes("gpt") || lower.includes("o1") || lower.includes("openai")) return "openai";
    if (lower.includes("claude") || lower.includes("anthropic")) return "anthropic";
    if (lower.includes("deepseek")) return "deepseek";
    if (lower.includes("qwen")) return "qwen";
    if (lower.includes("llama") || lower.includes("meta")) return "meta";
    return name;
  };

  const famCoder = getFamily(coderModel);
  const famSpec = getFamily(specModel);

  if (famCoder === famSpec) {
    return {
      isSameFamily: true,
      warning:
        "Cảnh báo thiên kiến đồng dạng (Homogeneous Bias): Model Coder và Spec cùng một họ mô hình có thể che giấu các lỗi hệ thống chung giữa sinh mã và sinh đặc tả.",
    };
  }

  return { isSameFamily: false };
}

/**
 * Deterministically estimates execution cost for an experiment run.
 */
export function estimateExperimentCost(config: ExperimentConfig, totalTasks = 164): CostEstimate {
  const runTasks = Math.round(totalTasks * (1 - config.heldOutRatio));

  // Anchor multiplier
  const anchorMultiplier = {
    A0: 1.0,
    A1: 1.2,
    A2: 2.0, // MR expansions
    A3: 3.5, // Differential multi-engine
  }[config.anchorLevel];

  // Baseline multiplier
  const baselineMultiplier = 1 + config.baselines.length * 0.4;

  const functionCalls = Math.round(runTasks * 24 * anchorMultiplier * baselineMultiplier);
  const llmDurationSec = Math.round(runTasks * 1.8 * anchorMultiplier);
  const z3DurationSec = config.policy === "strict" ? Math.round(runTasks * 0.9) : Math.round(runTasks * 0.3);
  const totalTokens = Math.round(runTasks * 3200 * anchorMultiplier);
  const estimatedUsd = Number(((totalTokens / 1_000_000) * 1.5).toFixed(2));

  return {
    functionCalls,
    llmDurationSec,
    z3DurationSec,
    totalTokens,
    estimatedUsd,
  };
}

/**
 * Simple deterministic 32-bit FNV-1a hash generator for strings.
 */
function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Deterministically generates an experiment manifest from config and seed.
 * STRICT INVARIANT: Calling this function multiple times with identical config
 * and seed will ALWAYS yield byte-for-byte identical manifests.
 */
export function generateDeterministicManifest(
  config: ExperimentConfig,
  totalTasks = 164
): ExperimentManifest {
  const cost = estimateExperimentCost(config, totalTasks);
  const heldOutCount = Math.round(totalTasks * config.heldOutRatio);
  const runCount = totalTasks - heldOutCount;

  // Compute canonical configuration signature
  const canonicalConfigStr = JSON.stringify({
    datasetId: config.datasetId,
    heldOutRatio: config.heldOutRatio,
    coderModel: config.coderModel,
    specModel: config.specModel,
    anchorLevel: config.anchorLevel,
    policy: config.policy,
    unknownMode: config.unknownMode,
    humanOracle: config.humanOracle,
    baselines: [...config.baselines].sort(),
    seed: config.seed,
  });

  const partitionChecksum = fnv1a(`${config.seed}:partition:${config.heldOutRatio}:${totalTasks}`);
  const manifestHash = fnv1a(`${canonicalConfigStr}:${partitionChecksum}`);

  return {
    manifestHash: `manif_${manifestHash}`,
    config: {
      ...config,
      baselines: [...config.baselines].sort(),
    },
    totalTasks,
    runTaskCount: runCount,
    heldOutTaskCount: heldOutCount,
    initialMonitorVersion: "P_0",
    estimatedCost: cost,
    partitionChecksum: `chk_${partitionChecksum}`,
  };
}
