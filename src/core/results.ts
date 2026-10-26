/**
 * src/reporting/results-data.ts — Kiểu dữ liệu kết quả RQ1–RQ6 & Export Engines
 *
 * Dữ liệu thật do backend trả về qua GET /api/runs/{runId}/results/{rq} (xem api.md).
 * File này chỉ định nghĩa hình dạng dữ liệu cho:
 *   - RQ1: Spec fault decomposition before vs after filtering
 *   - RQ2: Risk-Coverage Pareto curves & 4-class confusion matrix
 *   - RQ3: Ablation heatmap A0–A3 across evidence sources
 *   - RQ4: Homogeneous model pair failure (Coder x Spec on SILENT_FAULT)
 *   - RQ5: 5a–5d repair metrics suite & UNKNOWN_GATE cause breakdown
 *   - RQ6: Risk-Coverage-Query human interrogation efficiency
 *
 * Export engines: Valid LaTeX table, CSV, and JSON.
 */

export interface LinkedWitness {
  readonly caseId: string;
  readonly taskId: string;
  readonly witnessPreview: string;
  readonly verdict: string;
  readonly note?: string;
}

// ── Export Engines ────────────────────────────────────────────────────────────

export function generateLatexTable(
  caption: string,
  headers: ReadonlyArray<string>,
  rows: ReadonlyArray<ReadonlyArray<string | number>>
): string {
  const colAlign = "l" + "c".repeat(headers.length - 1);
  const headerLine = headers.join(" & ") + " \\\\";
  const bodyLines = rows.map((r) => r.join(" & ") + " \\\\").join("\n");

  return `\\begin{table}[htbp]
\\centering
\\caption{${caption}}
\\begin{tabular}{${colAlign}}
\\hline
${headerLine}
\\hline
${bodyLines}
\\hline
\\end{tabular}
\\end{table}`;
}

export function generateCsv(
  headers: ReadonlyArray<string>,
  rows: ReadonlyArray<ReadonlyArray<string | number>>
): string {
  const sanitize = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
  const headerStr = headers.map(sanitize).join(",");
  const bodyStr = rows.map((row) => row.map(sanitize).join(",")).join("\n");
  return `${headerStr}\n${bodyStr}`;
}

export function generateJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

// ── RQ1: Spec Fault Classes Before vs After Filtering ─────────────────────────

export interface RQ1Category {
  readonly category: string;
  readonly beforeCount: number;
  readonly afterCount: number;
  readonly reductionRatio: number;
  readonly witnesses: ReadonlyArray<LinkedWitness>;
}

// ── RQ2: Risk-Coverage Curves & 4-Class Confusion Matrix ──────────────────────

export interface RiskCoveragePoint {
  readonly coverage: number; // 0 - 100%
  readonly risk: number; // 0 - 100%
  readonly threshold: number;
  readonly witnesses: ReadonlyArray<LinkedWitness>;
}

export interface RQ2MethodData {
  readonly id: string;
  readonly name: string;
  readonly points: ReadonlyArray<RiskCoveragePoint>;
}

export interface ConfusionMatrixRow {
  readonly trueClass: string;
  readonly predAcc: number;
  readonly predSpec: number;
  readonly predCode: number;
  readonly predDual: number;
  readonly witnesses: ReadonlyArray<LinkedWitness>;
}

// ── RQ3: Ablation Heatmap A0–A3 x Evidence Sources ────────────────────────────

export interface AblationCell {
  readonly anchorLevel: "A0" | "A1" | "A2" | "A3";
  readonly source: string;
  readonly accuracy: number; // percentage
  readonly witnesses: ReadonlyArray<LinkedWitness>;
}

// ── RQ4: Correlation Heatmap Coder x Spec on SILENT_FAULT ─────────────────────

export interface ModelCorrelationCell {
  readonly coder: string;
  readonly spec: string;
  readonly silentFaultRate: number; // percentage
  readonly isHomogeneous: boolean;
  readonly witnesses: ReadonlyArray<LinkedWitness>;
}

// ── RQ5: 5a–5d Repair Metrics Suite & UNKNOWN_GATE Breakdown ──────────────────

export interface RQ5Metric {
  readonly key: "5a" | "5b" | "5c" | "5d";
  readonly title: string;
  readonly value: string;
  readonly unit: string;
  readonly interpretation: string;
  readonly witnesses: ReadonlyArray<LinkedWitness>;
}

export interface UnknownGateDecomposition {
  readonly check: "G1" | "G2" | "G3" | "G4" | "G5";
  readonly name: string;
  readonly failureCount: number;
  readonly percentage: number;
  readonly note: string;
  readonly witnesses: ReadonlyArray<LinkedWitness>;
}

// ── RQ6: Risk-Coverage-Query Trade-off ────────────────────────────────────────

export interface RQ6CurvePoint {
  readonly queriesCount: number;
  readonly coverage: number;
  readonly residualRisk: number;
  readonly witnesses: ReadonlyArray<LinkedWitness>;
}

export interface RQ6Strategy {
  readonly id: "active_adjudicated" | "random_query" | "query_all";
  readonly name: string;
  readonly points: ReadonlyArray<RQ6CurvePoint>;
}
