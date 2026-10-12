import { describe, it, expect } from "vitest";
import { aggregate } from "@/core/aggregator";
import type { GroundedEvidence } from "@/core/types";

describe("Formal Aggregator (R1–R6)", () => {
  it("R6: triggers UNKNOWN_EVIDENCE when evidence list is empty", () => {
    const result = aggregate([], 42, {
      specRejectsOutput: () => true,
    });
    expect(result.verdict).toBe("UNKNOWN_EVIDENCE");
    expect(result.matchedRule).toBe("R6");
  });

  it("R1: triggers UNKNOWN_CONFLICT when grounded expected outputs disagree", () => {
    const evidences: GroundedEvidence[] = [
      {
        id: "ev1",
        isGrounded: true,
        kind: "expected_output",
        source: "docstring_anchor",
        input: [2, 3],
        expected: 5,
      },
      {
        id: "ev2",
        isGrounded: true,
        kind: "expected_output",
        source: "differential_a3",
        input: [2, 3],
        expected: 6, // Disagrees with docstring anchor
      },
    ];

    const result = aggregate(evidences, 5, {
      specRejectsOutput: () => false,
    });
    expect(result.verdict).toBe("UNKNOWN_CONFLICT");
    expect(result.matchedRule).toBe("R1");
  });

  it("R2: triggers SPEC_FAULT when code matches e(w) but P0 rejects e(w)", () => {
    const evidences: GroundedEvidence[] = [
      {
        id: "ev1",
        isGrounded: true,
        kind: "expected_output",
        source: "docstring_anchor",
        input: 4,
        expected: 16,
      },
    ];

    // Code returned 16 (correct!), but spec rejected 16 (spec too tight!)
    const result = aggregate(evidences, 16, {
      specRejectsOutput: (val) => val === 16,
    });

    expect(result.verdict).toBe("SPEC_FAULT");
    expect(result.matchedRule).toBe("R2");
    expect(result.expectedOutput).toBe(16);
  });

  it("R3: triggers DUAL_FAULT when code is wrong and P0 also rejects e(w)", () => {
    const evidences: GroundedEvidence[] = [
      {
        id: "ev1",
        isGrounded: true,
        kind: "expected_output",
        source: "docstring_anchor",
        input: 4,
        expected: 16,
      },
    ];

    // Code returned 15 (buggy!), spec rejected 16 (also buggy!)
    const result = aggregate(evidences, 15, {
      specRejectsOutput: (val) => val === 16,
    });

    expect(result.verdict).toBe("DUAL_FAULT");
    expect(result.matchedRule).toBe("R3");
    expect(result.expectedOutput).toBe(16);
  });

  it("R5: triggers CODE_FAULT when code output violates e(w) but P0 accepts e(w)", () => {
    const evidences: GroundedEvidence[] = [
      {
        id: "ev1",
        isGrounded: true,
        kind: "expected_output",
        source: "differential_a3",
        input: 10,
        expected: 20,
      },
    ];

    // Code returned 19 (buggy!), spec accepts 20 (spec is correct!)
    const result = aggregate(evidences, 19, {
      specRejectsOutput: (val) => val !== 20,
    });

    expect(result.verdict).toBe("CODE_FAULT");
    expect(result.matchedRule).toBe("R5");
  });

  it("R4: triggers DUAL_FAULT when property φ is violated by both c and spec", () => {
    const evidences: GroundedEvidence[] = [
      {
        id: "ev1",
        isGrounded: true,
        kind: "property",
        source: "formal_a2",
        propertyId: "positive_output",
        description: "Output must be > 0",
        testOutput: (out) => typeof out === "number" && out > 0,
      },
    ];

    // Code returned -5 (violates property), spec rejects
    const result = aggregate(evidences, -5, {
      specRejectsOutput: () => true,
    });

    expect(result.verdict).toBe("DUAL_FAULT");
    expect(result.matchedRule).toBe("R4");
  });

  it("populates skipped rules with intelligible explanations for RuleLadder", () => {
    const evidences: GroundedEvidence[] = [
      {
        id: "ev1",
        isGrounded: true,
        kind: "expected_output",
        source: "docstring_anchor",
        input: 1,
        expected: 2,
      },
    ];

    const result = aggregate(evidences, 2, {
      specRejectsOutput: () => true,
    });

    expect(result.skippedRules).toHaveLength(1);
    expect(result.skippedRules[0]?.rule).toBe("R1");
  });
});
