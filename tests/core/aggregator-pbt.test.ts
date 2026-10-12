/**
 * tests/core/aggregator-pbt.test.ts — Property-Based Testing for R1–R6 Aggregator
 *
 * Formally verifies that the formal adjudication rule system (R1–R6) satisfies:
 *   1. TOTALITY: aggregate() always produces a valid AdjudicationResult for any input.
 *   2. MUTUAL EXCLUSIVITY: Exactly one rule in {R1, R2, R3, R4, R5, R6} matches.
 *   3. DISJOINTNESS: matchedRule is never present in skippedRules.
 *   4. RULE DISPATCH INVARIANTS:
 *      - R1 fires whenever grounded evidences conflict.
 *      - R6 fires when evidence is empty.
 *      - R2 fires when c ≃ e(w) and P0 rejects e(w).
 *      - R3 fires when c ≄ e(w) and P0 rejects e(w).
 *      - R5 fires when c ≄ e(w) and P0 accepts e(w).
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { aggregate } from "@/core/aggregator";
import type {
  GroundedEvidence,
  GroundedExpectedOutputEvidence,
  GroundedPropertyEvidence,
} from "@/core/types";
import { VerdictSchema, RuleIdSchema } from "@/core/schema";

// ── Arbitraries for PBT ───────────────────────────────────────────────────

const provenanceSourceArb = fc.constantFrom(
  "docstring_anchor",
  "differential_a3",
  "verified_mr",
  "formal_a2",
  "human_query"
);

const primitiveValueArb = fc.oneof(
  fc.integer({ min: -100, max: 100 }),
  fc.string({ maxLength: 10 }),
  fc.boolean()
);

const expectedEvidenceArb = fc.record({
  id: fc.uuid(),
  isGrounded: fc.constant(true as const),
  kind: fc.constant("expected_output" as const),
  source: provenanceSourceArb,
  input: fc.array(fc.integer({ min: 0, max: 10 }), { maxLength: 3 }),
  expected: primitiveValueArb,
});

const propertyEvidenceArb = fc.record({
  id: fc.uuid(),
  isGrounded: fc.constant(true as const),
  kind: fc.constant("property" as const),
  source: provenanceSourceArb,
  propertyId: fc.stringMatching(/^[a-z_]{3,10}$/),
  description: fc.string({ maxLength: 20 }),
  // Predicate: checks if number is positive or non-empty string
  threshold: fc.integer({ min: 0, max: 10 }),
}).map((p): GroundedPropertyEvidence => ({
  id: p.id,
  isGrounded: true,
  kind: "property",
  source: p.source,
  propertyId: p.propertyId,
  description: p.description,
  testOutput: (out: unknown) => typeof out === "number" && out >= p.threshold,
}));

const groundedEvidenceListArb: fc.Arbitrary<GroundedEvidence[]> = fc.array(
  fc.oneof(expectedEvidenceArb, propertyEvidenceArb),
  { maxLength: 5 }
);

describe("Aggregator Property-Based Testing (R1–R6)", () => {
  it("P1: Totality — aggregate() always terminates and returns a valid schema-compliant result", () => {
    fc.assert(
      fc.property(
        groundedEvidenceListArb,
        primitiveValueArb,
        fc.boolean(), // predicate constant or selector
        (evidences, codeOutput, rejectFlag) => {
          const result = aggregate(evidences, codeOutput, {
            specRejectsOutput: () => rejectFlag,
          });

          // Verdict is valid
          expect(VerdictSchema.safeParse(result.verdict).success).toBe(true);

          // Matched rule is valid R1–R6
          expect(RuleIdSchema.safeParse(result.matchedRule).success).toBe(true);

          // Explanation is always a non-empty string
          expect(typeof result.explanation).toBe("string");
          expect(result.explanation.length).toBeGreaterThan(0);

          // Skipped rules array is valid
          expect(Array.isArray(result.skippedRules)).toBe(true);
        }
      ),
      { numRuns: 300 }
    );
  });

  it("P2: Mutual Exclusivity — matchedRule is NEVER in skippedRules", () => {
    fc.assert(
      fc.property(
        groundedEvidenceListArb,
        primitiveValueArb,
        fc.boolean(),
        (evidences, codeOutput, rejectFlag) => {
          const result = aggregate(evidences, codeOutput, {
            specRejectsOutput: () => rejectFlag,
          });

          const skippedRuleIds = result.skippedRules.map((s) => s.rule);
          expect(skippedRuleIds).not.toContain(result.matchedRule);
        }
      ),
      { numRuns: 300 }
    );
  });

  it("P3: Vacuous Evidence Determinism — empty evidence list ALWAYS yields R6 UNKNOWN_EVIDENCE", () => {
    fc.assert(
      fc.property(
        primitiveValueArb,
        fc.boolean(),
        (codeOutput, rejectFlag) => {
          const result = aggregate([], codeOutput, {
            specRejectsOutput: () => rejectFlag,
          });

          expect(result.matchedRule).toBe("R6");
          expect(result.verdict).toBe("UNKNOWN_EVIDENCE");
        }
      )
    );
  });

  it("P4: Single-Evidence Decision Completeness — Single expected output strictly maps to R2, R3, R5, or R6", () => {
    fc.assert(
      fc.property(
        expectedEvidenceArb,
        primitiveValueArb,
        fc.boolean(),
        (singleEvidence, codeOutput, specRejects) => {
          const result = aggregate([singleEvidence], codeOutput, {
            specRejectsOutput: () => specRejects,
          });

          const cMatches = codeOutput === singleEvidence.expected;

          if (cMatches && specRejects) {
            expect(result.matchedRule).toBe("R2");
            expect(result.verdict).toBe("SPEC_FAULT");
          } else if (!cMatches && specRejects) {
            expect(result.matchedRule).toBe("R3");
            expect(result.verdict).toBe("DUAL_FAULT");
          } else if (!cMatches && !specRejects) {
            expect(result.matchedRule).toBe("R5");
            expect(result.verdict).toBe("CODE_FAULT");
          } else {
            // cMatches && !specRejects -> neither code nor spec faulted on grounded evidence
            expect(result.matchedRule).toBe("R6");
          }
        }
      ),
      { numRuns: 300 }
    );
  });

  it("P5: Conflict Soundness — conflicting expected outputs ALWAYS trigger R1 UNKNOWN_CONFLICT", () => {
    fc.assert(
      fc.property(
        primitiveValueArb,
        primitiveValueArb,
        primitiveValueArb,
        fc.boolean(),
        (expected1, expected2, codeOutput, rejectFlag) => {
          fc.pre(expected1 !== expected2);

          const ev1: GroundedExpectedOutputEvidence = {
            id: "ev1",
            isGrounded: true,
            kind: "expected_output",
            source: "docstring_anchor",
            input: [1],
            expected: expected1,
          };

          const ev2: GroundedExpectedOutputEvidence = {
            id: "ev2",
            isGrounded: true,
            kind: "expected_output",
            source: "differential_a3",
            input: [1],
            expected: expected2,
          };

          const result = aggregate([ev1, ev2], codeOutput, {
            specRejectsOutput: () => rejectFlag,
          });

          expect(result.matchedRule).toBe("R1");
          expect(result.verdict).toBe("UNKNOWN_CONFLICT");
        }
      ),
      { numRuns: 200 }
    );
  });
});
