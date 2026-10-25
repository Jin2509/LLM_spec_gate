/**
 * src/core/repair.ts — Pure Formal Repair Candidate Ranking & Gate Policy
 *
 * Implements deterministic candidate ranking:
 *   Candidate shape: C ∨ (g ∧ D)
 *   Order: (Family Priority, Complexity ASC, Guard Breadth ASC, ID)
 *
 * ZERO React/Next/UI/Mock dependencies.
 */
import type { RepairCandidate, RepairFamily, GateResult } from "./types";

export type GatePolicy = "strict" | "standard" | "shadow";

export type PassMode = "PASS_PROOF" | "PASS_SAMPLED" | "PASS_NO_A2";

export interface RankedRepairCandidate extends RepairCandidate {
  readonly complexity: number; // Character/AST token count
  readonly breadth: number; // Guard specificity / domain width
  readonly passMode?: PassMode;
  readonly isProofVerified?: boolean;
  readonly hasA2Anchor?: boolean;
}

export interface GatePolicyDecision {
  readonly canDeploy: boolean;
  readonly policy: GatePolicy;
  readonly actionLabel: string;
  readonly reason: string;
  readonly isShadowOnly: boolean;
}

const FAMILY_PRIORITY: Record<RepairFamily, number> = {
  case_exception: 1, // Most localized: C ∨ (g ∧ D)
  point_patch: 2, // Specific point repair
  broaden_bounds: 3, // Relax constraint boundary
  replace_predicate: 4, // Broader semantic swap
};

/**
 * Calculates deterministic AST / structural complexity of candidate replacement and guard.
 */
export function calculateComplexity(candidate: Pick<RepairCandidate, "guard" | "replacement">): number {
  const guardTokens = candidate.guard.trim().split(/\s+/).length;
  const replTokens = candidate.replacement.trim().split(/\s+/).length;
  return guardTokens * 2 + replTokens * 3 + candidate.replacement.length;
}

/**
 * Calculates guard breadth metric (lower = more localized / narrower).
 */
export function calculateGuardBreadth(guard: string): number {
  if (guard === "true" || guard === "⊤" || guard === "1") return 999;
  // Specificity heuristics: equality (narrow) < inequality (wider) < unbounded
  let breadth = 10;
  if (guard.includes("==")) breadth -= 5;
  if (guard.includes("in ")) breadth -= 2;
  if (guard.includes("<") || guard.includes(">")) breadth += 10;
  return Math.max(1, breadth);
}

/**
 * Deterministically sorts repair candidates:
 * 1. Family priority (case_exception < point_patch < broaden_bounds < replace_predicate)
 * 2. Complexity ASC
 * 3. Breadth ASC
 * 4. Identifier lexicographical order
 */
export function rankCandidates<T extends RankedRepairCandidate>(candidates: ReadonlyArray<T>): T[] {
  return [...candidates].sort((a, b) => {
    const famA = FAMILY_PRIORITY[a.family] ?? 99;
    const famB = FAMILY_PRIORITY[b.family] ?? 99;
    if (famA !== famB) return famA - famB;

    if (a.complexity !== b.complexity) return a.complexity - b.complexity;
    if (a.breadth !== b.breadth) return a.breadth - b.breadth;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Checks if B ∪ B_synth is empty inside guard g.
 * If empty, triggers a crucial formal warning (vacuous patch danger).
 */
export function isBOrBSynthEmptyInGuard(
  tracesInB: ReadonlyArray<{ input: unknown; inGuard: boolean }>,
  tracesInBSynth: ReadonlyArray<{ input: unknown; inGuard: boolean }>
): boolean {
  const bInGuard = tracesInB.some((t) => t.inGuard);
  const bSynthInGuard = tracesInBSynth.some((t) => t.inGuard);
  return !bInGuard && !bSynthInGuard;
}

/**
 * Determines PassMode for a passed GateResult:
 *   - PASS_PROOF: Z3 proved all structural and G4/G5 conditions
 *   - PASS_NO_A2: Passed without A2 metamorphic anchor
 *   - PASS_SAMPLED: Passed through finite test sample execution
 */
export function determinePassMode(
  gateResult: GateResult,
  options: { isProofVerified?: boolean; hasA2Anchor?: boolean } = {}
): PassMode | undefined {
  if (!gateResult.passed) return undefined;
  if (options.isProofVerified && gateResult.guaranteeNature === "proof") {
    return "PASS_PROOF";
  }
  if (options.hasA2Anchor === false) {
    return "PASS_NO_A2";
  }
  return "PASS_SAMPLED";
}

/**
 * Evaluates deployability based on selected policy:
 *   - strict: only PASS_PROOF
 *   - standard: PASS_PROOF | PASS_SAMPLED | PASS_NO_A2
 *   - shadow: records candidate only (no monitor swap)
 */
export function evaluateGatePolicy(
  policy: GatePolicy,
  gateResult: GateResult | undefined,
  passMode: PassMode | undefined
): GatePolicyDecision {
  if (!gateResult || !gateResult.passed) {
    return {
      canDeploy: false,
      policy,
      actionLabel: "Bị chặn bởi Gate",
      reason: "Ứng viên không vượt qua pipeline Gate G1–G5.",
      isShadowOnly: false,
    };
  }

  if (policy === "shadow") {
    return {
      canDeploy: true,
      policy: "shadow",
      actionLabel: "Ghi nhận Shadow",
      reason: "Chế độ Shadow: Ghi nhận ứng viên vào shadow log, không thay thế monitor hoạt động.",
      isShadowOnly: true,
    };
  }

  if (policy === "strict") {
    if (passMode === "PASS_PROOF") {
      return {
        canDeploy: true,
        policy: "strict",
        actionLabel: "Triển khai (Strict Proof)",
        reason: "Đạt chuẩn PASS_PROOF: Z3 đã chứng minh hình thức đầy đủ.",
        isShadowOnly: false,
      };
    }
    return {
      canDeploy: false,
      policy: "strict",
      actionLabel: "Yêu cầu Chứng minh Hình thức",
      reason: `Chính sách Strict từ chối triển khai ở chế độ ${passMode ?? "SAMPLED"}. Bắt buộc phải có PASS_PROOF từ Z3.`,
      isShadowOnly: false,
    };
  }

  // policy === "standard"
  return {
    canDeploy: true,
    policy: "standard",
    actionLabel: "Triển khai Monitor P'",
    reason: `Chính sách Standard: Chấp nhận triển khai với kết quả ${passMode ?? "PASS_SAMPLED"}.`,
    isShadowOnly: false,
  };
}
