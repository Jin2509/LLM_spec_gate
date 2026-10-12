import { describe, it, expect } from "vitest";
import { evaluateGate } from "@/core/gate";
import type { RepairCandidate } from "@/core/types";

describe("Fail-Closed Gate G1–G5 Pipeline (gate.ts)", () => {
  const candidate: RepairCandidate = {
    id: "rep_1",
    family: "broaden_bounds",
    guard: "x >= 0",
    replacement: "result >= 0",
    targetExpectedOutput: 10,
    rank: 1,
    diffPreview: "diff",
  };

  it("fails immediately when no candidate is available", () => {
    const result = evaluateGate(undefined, {
      pPrimeAcceptsExpected: true,
      pPrimeRejectsB: true,
      localityHolds: true,
      preservesGAndA2: true,
      inRepairGrammar: true,
    });

    expect(result.passed).toBe(false);
    expect(result.unknownGateReason).toBe("no_candidate_in_grammar");
  });

  it("fails-fast at G1 if P' does not accept expected output", () => {
    const result = evaluateGate(candidate, {
      pPrimeAcceptsExpected: false,
      pPrimeRejectsB: true,
      localityHolds: true,
      preservesGAndA2: true,
      inRepairGrammar: true,
    });

    expect(result.passed).toBe(false);
    expect(result.firstFailedCheck).toBe("G1: Accept-grounded");
  });

  it("fails-fast at G2 if P' accepts a bad trace in B", () => {
    const result = evaluateGate(candidate, {
      pPrimeAcceptsExpected: true,
      pPrimeRejectsB: false, // violates G2
      localityHolds: true,
      preservesGAndA2: true,
      inRepairGrammar: true,
    });

    expect(result.passed).toBe(false);
    expect(result.firstFailedCheck).toBe("G2: Reject-B");
    expect(result.checks.g1_accept_grounded).toBe(true);
    expect(result.checks.g2_reject_b).toBe(false);
  });

  it("passes all G1–G5 checks and assigns proof/structural guarantee", () => {
    const result = evaluateGate(candidate, {
      pPrimeAcceptsExpected: true,
      pPrimeRejectsB: true,
      localityHolds: true,
      preservesGAndA2: true,
      inRepairGrammar: true,
      isProofVerified: true,
    });

    expect(result.passed).toBe(true);
    expect(result.guaranteeNature).toBe("proof");
    expect(result.checks.g1_accept_grounded).toBe(true);
    expect(result.checks.g5_in_repair_space_and_bsynth).toBe(true);
  });
});
