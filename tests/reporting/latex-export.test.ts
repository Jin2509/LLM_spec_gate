import { describe, it, expect } from "vitest";
import { generateLatexTable, generateCsv, generateJson } from "@/core/results";

describe("LaTeX & Structured Data Export Engines", () => {
  const headers = ["Phương pháp", "Coverage (%)", "Residual Risk (%)"];
  const rows = [
    ["Proposed (Fail-Closed)", 94.0, 4.1],
    ["Fail-Open", 100.0, 22.3],
    ["Raw Dual-Oracle", 100.0, 38.6],
  ];

  it("generates valid compilable LaTeX tabular environment", () => {
    const latex = generateLatexTable("Bảng so sánh hiệu quả", headers, rows);

    expect(latex).toContain("\\begin{table}[htbp]");
    expect(latex).toContain("\\centering");
    expect(latex).toContain("\\caption{Bảng so sánh hiệu quả}");
    expect(latex).toContain("\\begin{tabular}{lcc}");
    expect(latex).toContain("Phương pháp & Coverage (%) & Residual Risk (%) \\\\");
    expect(latex).toContain("\\hline");
    expect(latex).toContain("Proposed (Fail-Closed) & 94 & 4.1 \\\\");
    expect(latex).toContain("\\end{tabular}");
    expect(latex).toContain("\\end{table}");
  });

  it("generates standard CSV with quoted headers and rows", () => {
    const csv = generateCsv(headers, rows);

    expect(csv).toContain('"Phương pháp","Coverage (%)","Residual Risk (%)"');
    expect(csv).toContain('"Proposed (Fail-Closed)","94","4.1"');
  });

  it("generates valid indented JSON", () => {
    const jsonStr = generateJson({ test: 123, list: ["a", "b"] });
    const parsed = JSON.parse(jsonStr);

    expect(parsed.test).toBe(123);
    expect(parsed.list).toEqual(["a", "b"]);
  });
});
