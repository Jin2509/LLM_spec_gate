import { describe, it, expect } from "vitest";
import { readGrading, stripGrading } from "@/guard/grading-proxy";

describe("Grading Proxy Guard (grading-proxy.ts)", () => {
  it("reads grading correctly through proxy", () => {
    const rawRecord = {
      id: "case_01",
      input: [1, 2],
      grading: { groundTruth: 3, isOracleCorrect: true },
    };

    const val = readGrading(rawRecord);
    expect(val).toEqual({ groundTruth: 3, isOracleCorrect: true });
  });

  it("strips grading recursively to prevent data leakage to client", () => {
    const payload = {
      caseId: "c_10",
      data: {
        witness: [5],
        grading: "SUPER_SECRET_EVAL_LABEL",
      },
      list: [
        { id: 1, grading: "SECRET_1", score: 100 },
        { id: 2, score: 200 },
      ],
      grading: "TOP_LEVEL_SECRET",
    };

    const clean = stripGrading(payload);

    expect(clean).not.toHaveProperty("grading");
    expect(clean.data).not.toHaveProperty("grading");
    expect(clean.list[0]).not.toHaveProperty("grading");
    expect(clean.list[0]?.score).toBe(100);
    expect(clean.list[1]?.score).toBe(200);
  });
});
