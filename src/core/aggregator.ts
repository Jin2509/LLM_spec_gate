/**
 * src/core/aggregator.ts — Pure Formal Adjudication Aggregator
 *
 * Implements deterministic rules R1–R6:
 *   R1: Grounded evidence conflict -> UNKNOWN_CONFLICT
 *   R2: Grounded e(w), c ≃ e(w), P0 rejects e(w) -> SPEC_FAULT
 *   R3: Grounded e(w), c ≄ e(w), P0 rejects e(w) -> DUAL_FAULT (target e(w))
 *   R4: Grounded property φ, c violates φ, P0 violates φ -> DUAL_FAULT (no target)
 *   R5: Grounded evidence violated by c, but P0 accepts e(w) / satisfies φ -> CODE_FAULT
 *   R6: No grounded evidence -> UNKNOWN_EVIDENCE
 *
 * STRICT INVARIANTS:
 *   - Only receives GroundedEvidence[] (AdvisoryEvidence is rejected by TypeScript)
 *   - Pure, deterministic, zero side-effects
 *   - Exhaustive & mutually exclusive rule dispatch
 *   - Returns skipped list with exact explanations for RuleLadder
 */
import type {
  GroundedEvidence,
  GroundedExpectedOutputEvidence,
  GroundedPropertyEvidence,
  AdjudicationResult,
  RuleId,
} from "./types";
import { areEquivalent } from "./equivalence";

export interface AggregateOptions {
  /** Predicate checking whether spec P0 rejects a given output value at witness w */
  specRejectsOutput: (output: unknown) => boolean;
  /** Optional epsilon tolerance */
  epsilon?: number;
}

export function aggregate(
  evidenceList: ReadonlyArray<GroundedEvidence>,
  codeOutput: unknown,
  options: AggregateOptions
): AdjudicationResult {
  const { specRejectsOutput, epsilon } = options;
  const skipped: Array<{ rule: RuleId; reason: string }> = [];

  // Filter into expected-output vs property evidences
  const expectedEvidences = evidenceList.filter(
    (e): e is GroundedExpectedOutputEvidence => e.kind === "expected_output"
  );
  const propertyEvidences = evidenceList.filter(
    (e): e is GroundedPropertyEvidence => e.kind === "property"
  );

  // ── R1: Kiểm tra mâu thuẫn giữa các nguồn Grounded (Conflict Check) ────────
  if (expectedEvidences.length > 1) {
    const first = expectedEvidences[0];
    if (first) {
      for (let i = 1; i < expectedEvidences.length; i++) {
        const other = expectedEvidences[i];
        if (other) {
          const eq = areEquivalent(first.expected, other.expected, { epsilon });
          if (!eq.equal) {
            return {
              verdict: "UNKNOWN_CONFLICT",
              matchedRule: "R1",
              skippedRules: skipped,
              explanation: `Mâu thuẫn giữa hai nguồn grounded: ${first.source} cho ${String(first.expected)} nhưng ${other.source} cho ${String(other.expected)} (${eq.reason})`,
            };
          }
        }
      }
    }
  }

  // Cross-check expected output against properties
  if (expectedEvidences.length > 0 && propertyEvidences.length > 0) {
    const primaryExp = expectedEvidences[0];
    if (primaryExp) {
      for (const prop of propertyEvidences) {
        if (!prop.testOutput(primaryExp.expected)) {
          return {
            verdict: "UNKNOWN_CONFLICT",
            matchedRule: "R1",
            skippedRules: skipped,
            explanation: `Mâu thuẫn giữa đầu ra kỳ vọng từ ${primaryExp.source} và thuộc tính grounded ${prop.propertyId}`,
          };
        }
      }
    }
  }

  skipped.push({
    rule: "R1",
    reason: "Các nguồn grounded không mâu thuẫn nhau (hoặc chỉ có 0-1 nguồn)",
  });

  // ── R6: Kiểm tra thiếu bằng chứng Grounded (Evidence check) ────────────────
  if (evidenceList.length === 0) {
    return {
      verdict: "UNKNOWN_EVIDENCE",
      matchedRule: "R6",
      skippedRules: skipped,
      explanation: "Không có bằng chứng grounded nào tại witness w",
    };
  }

  // Pick primary expected output evidence if available
  const primaryExpected = expectedEvidences[0];

  if (primaryExpected) {
    const eq = areEquivalent(codeOutput, primaryExpected.expected, {
      epsilon: primaryExpected.epsilon ?? epsilon,
    });
    const cMatchesExpected = eq.equal;
    const p0RejectsExpected = specRejectsOutput(primaryExpected.expected);

    // ── R2: c = e(w) và P0 bác e(w) -> SPEC_FAULT ───────────────────────────
    if (cMatchesExpected && p0RejectsExpected) {
      return {
        verdict: "SPEC_FAULT",
        matchedRule: "R2",
        skippedRules: skipped,
        expectedOutput: primaryExpected.expected,
        explanation: `Code trả về đúng e(w) (${eq.reason}), nhưng monitor P0 bác bỏ e(w). Lỗi do đặc tả quá chặt.`,
      };
    }
    skipped.push({
      rule: "R2",
      reason: !cMatchesExpected
        ? `Code không khớp e(w) (${eq.reason})`
        : "P0 không bác bỏ e(w)",
    });

    // ── R3: c ≠ e(w) và P0 cũng bác e(w) -> DUAL_FAULT có e(w) ──────────────
    if (!cMatchesExpected && p0RejectsExpected) {
      return {
        verdict: "DUAL_FAULT",
        matchedRule: "R3",
        skippedRules: skipped,
        expectedOutput: primaryExpected.expected,
        explanation: `Cả hai cùng sai: code trả về sai (${eq.reason}) và monitor P0 cũng bác bỏ đầu ra đúng e(w).`,
      };
    }
    skipped.push({
      rule: "R3",
      reason: cMatchesExpected
        ? "Code khớp e(w)"
        : "P0 không bác bỏ đầu ra đúng e(w)",
    });

    // ── R5: c ≠ e(w) nhưng P0 chấp nhận e(w) -> CODE_FAULT ──────────────────
    if (!cMatchesExpected && !p0RejectsExpected) {
      return {
        verdict: "CODE_FAULT",
        matchedRule: "R5",
        skippedRules: skipped,
        expectedOutput: primaryExpected.expected,
        explanation: `Code trả về sai so với e(w) (${eq.reason}), trong khi monitor P0 chấp nhận e(w). Lỗi thuộc về code.`,
      };
    }
    skipped.push({
      rule: "R5",
      reason: "Code khớp e(w) hoặc P0 bác bỏ e(w)",
    });
  } else {
    // Only property evidences exist
    skipped.push({
      rule: "R2",
      reason: "Không có bằng chứng expected-output e(w), chỉ có thuộc tính φ",
    });
    skipped.push({
      rule: "R3",
      reason: "Không có bằng chứng expected-output e(w), chỉ có thuộc tính φ",
    });

    const cViolatesProp = propertyEvidences.some((p) => !p.testOutput(codeOutput));
    // For R4/R7: check if P0 also violates property
    const p0ViolatesProp = propertyEvidences.some((p) =>
      specRejectsOutput(codeOutput) && !p.testOutput(codeOutput)
    );

    // ── R4: c vi phạm φ và P0 cũng vi phạm φ -> DUAL_FAULT không đích ───────
    if (cViolatesProp && p0ViolatesProp) {
      return {
        verdict: "DUAL_FAULT",
        matchedRule: "R4",
        skippedRules: skipped,
        explanation: "Code vi phạm thuộc tính φ và monitor P0 cũng vi phạm φ. Không có đích e(w) để sửa spec.",
      };
    }
    skipped.push({
      rule: "R4",
      reason: "Không đồng thời vi phạm thuộc tính φ ở cả code và spec",
    });

    // ── R5: c vi phạm φ nhưng P0 tuân thủ φ -> CODE_FAULT ────────────────────
    if (cViolatesProp) {
      return {
        verdict: "CODE_FAULT",
        matchedRule: "R5",
        skippedRules: skipped,
        explanation: "Code vi phạm thuộc tính grounded φ trong khi monitor P0 xác định đúng.",
      };
    }
    skipped.push({
      rule: "R5",
      reason: "Code không vi phạm bất kỳ thuộc tính grounded nào",
    });
  }

  // ── R6 Fallback: không đủ căn cứ kết luận ─────────────────────────────────
  return {
    verdict: "UNKNOWN_EVIDENCE",
    matchedRule: "R6",
    skippedRules: skipped,
    explanation: "Bằng chứng hiện có không đủ để quy trách nhiệm cho code hay spec.",
  };
}
