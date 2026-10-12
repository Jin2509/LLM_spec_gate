import { describe, it, expect } from "vitest";
import {
  rankCandidates,
  calculateComplexity,
  calculateGuardBreadth,
  isBOrBSynthEmptyInGuard,
  evaluateGatePolicy,
  determinePassMode,
  type RankedRepairCandidate,
} from "@/core/repair";
import type { GateResult } from "@/core/types";

describe("Repair Candidate Ranking & Policy Core", () => {
  const dummyGatePassed: GateResult = {
    passed: true,
    checks: {
      g1_accept_grounded: true,
      g2_reject_b: true,
      g3_locality: true,
      g4_preserve_g_a2: true,
      g5_in_repair_space_and_bsynth: true,
    },
    guaranteeNature: "proof",
    message: "Gate passed",
  };

  it("calculates complexity, breadth, and pass modes", () => {
    const comp = calculateComplexity({ guard: "w > 0", replacement: "ret == 1" });
    expect(comp).toBeGreaterThan(0);

    const breadth = calculateGuardBreadth("len(w) == 4");
    expect(breadth).toBe(5);

    const modeProof = determinePassMode(dummyGatePassed, { isProofVerified: true });
    expect(modeProof).toBe("PASS_PROOF");
  });

  it("deterministically ranks candidates by family, then complexity, then breadth", () => {
    const candidates: RankedRepairCandidate[] = [
      {
        id: "cand_broaden",
        family: "broaden_bounds",
        guard: "len(w) >= 2",
        replacement: "all(x <= y for x, y in zip(ret, ret[1:]))",
        targetExpectedOutput: [1, 2],
        rank: 3,
        diffPreview: "",
        complexity: 80,
        breadth: 15,
      },
      {
        id: "cand_point",
        family: "point_patch",
        guard: "w == [1, 2]",
        replacement: "ret == [1, 2]",
        targetExpectedOutput: [1, 2],
        rank: 2,
        diffPreview: "",
        complexity: 30,
        breadth: 5,
      },
      {
        id: "cand_case_complex",
        family: "case_exception",
        guard: "len(w) == 4",
        replacement: "ret[0] <= ret[2] and ret[1] == w[1] and ret[3] == w[3]",
        targetExpectedOutput: [1, 2],
        rank: 1,
        diffPreview: "",
        complexity: 60,
        breadth: 5,
      },
      {
        id: "cand_case_simple",
        family: "case_exception",
        guard: "len(w) == 4",
        replacement: "ret[0] <= ret[2]",
        targetExpectedOutput: [1, 2],
        rank: 1,
        diffPreview: "",
        complexity: 25,
        breadth: 5,
      },
    ];

    const sorted = rankCandidates(candidates);
    // case_exception comes first, sorted by complexity
    expect(sorted[0]?.id).toBe("cand_case_simple");
    expect(sorted[1]?.id).toBe("cand_case_complex");
    // point_patch comes next
    expect(sorted[2]?.id).toBe("cand_point");
    // broaden_bounds comes last
    expect(sorted[3]?.id).toBe("cand_broaden");
  });

  it("detects when B ∪ B_synth is empty inside guard g", () => {
    const tracesB = [{ input: [1, 2], inGuard: false }];
    const tracesBSynth = [{ input: [3, 4], inGuard: false }];

    expect(isBOrBSynthEmptyInGuard(tracesB, tracesBSynth)).toBe(true);

    const tracesBWithG = [{ input: [1, 2], inGuard: true }];
    expect(isBOrBSynthEmptyInGuard(tracesBWithG, tracesBSynth)).toBe(false);
  });

  it("enforces strict policy: only PASS_PROOF can deploy", () => {
    const strictProof = evaluateGatePolicy("strict", dummyGatePassed, "PASS_PROOF");
    expect(strictProof.canDeploy).toBe(true);
    expect(strictProof.isShadowOnly).toBe(false);

    const strictSampled = evaluateGatePolicy("strict", dummyGatePassed, "PASS_SAMPLED");
    expect(strictSampled.canDeploy).toBe(false);

    const strictNoA2 = evaluateGatePolicy("strict", dummyGatePassed, "PASS_NO_A2");
    expect(strictNoA2.canDeploy).toBe(false);
  });

  it("enforces standard policy: accepts all 3 pass modes", () => {
    expect(evaluateGatePolicy("standard", dummyGatePassed, "PASS_PROOF").canDeploy).toBe(true);
    expect(evaluateGatePolicy("standard", dummyGatePassed, "PASS_SAMPLED").canDeploy).toBe(true);
    expect(evaluateGatePolicy("standard", dummyGatePassed, "PASS_NO_A2").canDeploy).toBe(true);
  });

  it("enforces shadow policy: allows recording without monitor swap", () => {
    const shadowDecision = evaluateGatePolicy("shadow", dummyGatePassed, "PASS_SAMPLED");
    expect(shadowDecision.canDeploy).toBe(true);
    expect(shadowDecision.isShadowOnly).toBe(true);
    expect(shadowDecision.actionLabel).toBe("Ghi nhận Shadow");
  });
});
