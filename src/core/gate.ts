/**
 * src/core/gate.ts — Fail-Closed Gate G1–G5 Pipeline
 *
 * Implements the 5 fail-fast checks:
 *   G1. Accept-grounded: P' accepts (w, e(w))
 *   G2. Reject-B: P' rejects all traces in B
 *   G3. Locality: for all t ∉ g, P'(t) = P0(t)
 *   G4. Preserve-G/A2: P' accepts all traces in G and is consistent with A2
 *   G5. In-repair-space: P' in finite repair grammar, g ≠ ⊤, C' ≠ ⊤, rejects B_synth
 *
 * Fail-fast: terminates at the first failed check.
 */
import type { GateResult, GuaranteeNature, RepairCandidate } from "./types";

export interface GateContext {
  pPrimeAcceptsExpected: boolean;
  pPrimeRejectsB: boolean;
  localityHolds: boolean;
  preservesGAndA2: boolean;
  inRepairGrammar: boolean;
  rejectsBSynth?: boolean;
  isProofVerified?: boolean; // Z3 proved G5
}

export function evaluateGate(
  candidate: RepairCandidate | undefined,
  context: GateContext
): GateResult {
  if (!candidate) {
    return {
      passed: false,
      checks: {
        g1_accept_grounded: false,
        g2_reject_b: false,
        g3_locality: false,
        g4_preserve_g_a2: false,
        g5_in_repair_space_and_bsynth: false,
      },
      firstFailedCheck: "Grammar",
      unknownGateReason: "no_candidate_in_grammar",
      guaranteeNature: "n/a",
      message: "Không sinh được ứng viên repair nào từ grammar chuẩn.",
    };
  }

  // G1: Accept-grounded
  if (!context.pPrimeAcceptsExpected) {
    return {
      passed: false,
      checks: {
        g1_accept_grounded: false,
        g2_reject_b: false,
        g3_locality: false,
        g4_preserve_g_a2: false,
        g5_in_repair_space_and_bsynth: false,
      },
      firstFailedCheck: "G1: Accept-grounded",
      unknownGateReason: "rejected_by_gate",
      guaranteeNature: "structural",
      message: "P' không chấp nhận đầu ra đúng e(w).",
    };
  }

  // G2: Reject-B
  if (!context.pPrimeRejectsB) {
    return {
      passed: false,
      checks: {
        g1_accept_grounded: true,
        g2_reject_b: false,
        g3_locality: false,
        g4_preserve_g_a2: false,
        g5_in_repair_space_and_bsynth: false,
      },
      firstFailedCheck: "G2: Reject-B",
      unknownGateReason: "rejected_by_gate",
      guaranteeNature: "finite-set",
      message: "P' vô tình chấp nhận ít nhất một trace xấu trong tập B.",
    };
  }

  // G3: Locality
  if (!context.localityHolds) {
    return {
      passed: false,
      checks: {
        g1_accept_grounded: true,
        g2_reject_b: true,
        g3_locality: false,
        g4_preserve_g_a2: false,
        g5_in_repair_space_and_bsynth: false,
      },
      firstFailedCheck: "G3: Locality",
      unknownGateReason: "rejected_by_gate",
      guaranteeNature: "structural",
      message: "P' thay đổi hành vi ngoài vùng điều kiện g so với P0.",
    };
  }

  // G4: Preserve-G/A2
  if (!context.preservesGAndA2) {
    return {
      passed: false,
      checks: {
        g1_accept_grounded: true,
        g2_reject_b: true,
        g3_locality: true,
        g4_preserve_g_a2: false,
        g5_in_repair_space_and_bsynth: false,
      },
      firstFailedCheck: "G4: Preserve-G/A2",
      unknownGateReason: "rejected_by_gate",
      guaranteeNature: "proof",
      message: "P' phá vỡ các hành vi đã được xác nhận trong G hoặc không nhất quán với A2.",
    };
  }

  // G5: In-repair-space & B_synth
  const bSynthOk = context.rejectsBSynth ?? true;
  if (!context.inRepairGrammar || !bSynthOk) {
    return {
      passed: false,
      checks: {
        g1_accept_grounded: true,
        g2_reject_b: true,
        g3_locality: true,
        g4_preserve_g_a2: true,
        g5_in_repair_space_and_bsynth: false,
      },
      firstFailedCheck: "G5: In-repair-space & B_synth",
      unknownGateReason: "rejected_by_gate",
      guaranteeNature: "finite-set",
      message: "P' vi phạm cấu trúc repair grammar hoặc chấp nhận trace đột biến B_synth.",
    };
  }

  const nature: GuaranteeNature = context.isProofVerified
    ? "proof"
    : "structural";

  return {
    passed: true,
    checks: {
      g1_accept_grounded: true,
      g2_reject_b: true,
      g3_locality: true,
      g4_preserve_g_a2: true,
      g5_in_repair_space_and_bsynth: true,
    },
    guaranteeNature: nature,
    message: `Vượt qua Gate fail-closed (${nature === "proof" ? "PASS_PROOF" : "SAMPLED"}). Đủ điều kiện thay monitor.`,
  };
}
