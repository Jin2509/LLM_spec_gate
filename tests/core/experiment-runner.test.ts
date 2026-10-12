import { describe, it, expect } from "vitest";
import {
  type ExperimentConfig,
  generateDeterministicManifest,
  checkHomogeneousModelFamily,
  estimateExperimentCost,
} from "@/core/experiment";

describe("Experiment Runner & Deterministic Manifest Generator", () => {
  const configA: ExperimentConfig = {
    datasetId: "evalplus_illustrative",
    heldOutRatio: 0.25,
    coderModel: "gpt-4o",
    specModel: "claude-3-5-sonnet",
    anchorLevel: "A2",
    policy: "standard",
    unknownMode: "closed",
    humanOracle: "off",
    baselines: ["Raw Dual-Oracle (No Adjudication)", "Unit Test Generator (EvalPlus)"],
    seed: "rq_seed_42_experiment",
  };

  it("STRICT INVARIANT: Two runner invocations with identical config & seed produce strictly identical manifests", () => {
    const run1 = generateDeterministicManifest(configA, 164);
    const run2 = generateDeterministicManifest(configA, 164);

    expect(run1.manifestHash).toBe(run2.manifestHash);
    expect(run1.partitionChecksum).toBe(run2.partitionChecksum);
    expect(run1.runTaskCount).toBe(run2.runTaskCount);
    expect(run1.heldOutTaskCount).toBe(run2.heldOutTaskCount);
    expect(run1.estimatedCost).toEqual(run2.estimatedCost);

    // Deep equality on entire object
    expect(JSON.stringify(run1)).toBe(JSON.stringify(run2));
  });

  it("produces a different manifest hash when seed or configuration changes", () => {
    const runOriginal = generateDeterministicManifest(configA, 164);
    const runDifferentSeed = generateDeterministicManifest(
      { ...configA, seed: "another_seed_99" },
      164
    );

    expect(runOriginal.manifestHash).not.toBe(runDifferentSeed.manifestHash);
  });

  it("detects homogeneous model family bias between coder and spec", () => {
    const sameFamily = checkHomogeneousModelFamily("gpt-4o", "gpt-4o-mini");
    expect(sameFamily.isSameFamily).toBe(true);
    expect(sameFamily.warning).toContain("Homogeneous Bias");

    const differentFamily = checkHomogeneousModelFamily("gpt-4o", "claude-3-5-sonnet");
    expect(differentFamily.isSameFamily).toBe(false);
  });

  it("calculates realistic cost estimations for experiment runs", () => {
    const cost = estimateExperimentCost(configA, 164);
    expect(cost.functionCalls).toBeGreaterThan(0);
    expect(cost.llmDurationSec).toBeGreaterThan(0);
    expect(cost.z3DurationSec).toBeGreaterThan(0);
    expect(cost.totalTokens).toBeGreaterThan(0);
    expect(cost.estimatedUsd).toBeGreaterThan(0);
  });
});
