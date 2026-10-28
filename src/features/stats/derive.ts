/** Các phép tổng hợp thuần trên danh sách run cho trang thống kê. */
import type { Run } from "@/core/evaluation-types";

/** Gom các mã UNKNOWN_* về một nhóm khi đếm theo verdict. */
function verdictLabel(verdict: unknown): string {
  const v = String(verdict ?? "");
  return v.startsWith("UNKNOWN") ? "UNKNOWN" : v;
}

/** ACC = đặc tả và code khớp nhau (kết luận "consistent" của trang Hỏi đáp). */
export const VERDICT_CLASSES = ["ACC", "CODE_FAULT", "SPEC_FAULT", "UNKNOWN"] as const;

const lastVerdict = (run: Run) => run.verdicts.at(-1);

export function countByProblem(runs: readonly Run[]): Array<[string, Record<string, number>]> {
  const counts = new Map<string, Record<string, number>>();
  for (const run of runs) {
    const current = counts.get(run.problem_id) ?? { ACC: 0, CODE_FAULT: 0, SPEC_FAULT: 0, UNKNOWN: 0 };
    const label = verdictLabel(lastVerdict(run));
    if (label in current) current[label] = (current[label] ?? 0) + 1;
    counts.set(run.problem_id, current);
  }
  return [...counts];
}

export function countByDay(runs: readonly Run[]): Array<[string, { total: number; unknown: number }]> {
  const data = new Map<string, { total: number; unknown: number }>();
  for (const run of runs) {
    const key = run.created_at.slice(0, 10);
    const value = data.get(key) ?? { total: 0, unknown: 0 };
    value.total++;
    if (verdictLabel(lastVerdict(run)) === "UNKNOWN") value.unknown++;
    data.set(key, value);
  }
  return [...data];
}

export function confusionMatrix(runs: readonly Run[]): number[][] {
  return VERDICT_CLASSES.map((gold) =>
    VERDICT_CLASSES.map(
      (pred) => runs.filter((r) => r.gold_label && verdictLabel(r.gold_label) === gold && verdictLabel(lastVerdict(r)) === pred).length,
    ),
  );
}

export function confidenceHistogram(runs: readonly Run[]): number[] {
  const histogram = [0, 0, 0, 0, 0];
  for (const run of runs) {
    if (run.confidence == null) continue;
    const bucket = Math.min(4, Math.floor(run.confidence * 5));
    histogram[bucket] = (histogram[bucket] ?? 0) + 1;
  }
  return histogram;
}

/** Nhóm run theo cặp phiên bản agent (spec × code) lấy từ metadata do backend ghi. */
export function countByModelPair(runs: readonly Run[]): Array<{ pair: string; total: number; unknown: number }> {
  const data = new Map<string, { total: number; unknown: number }>();
  for (const run of runs) {
    if (!run.spec?.model && !run.code?.model) continue;
    const label = (o?: { model?: string; version?: string }) => [o?.model ?? "—", o?.version].filter(Boolean).join("@");
    const key = `spec ${label(run.spec)} × code ${label(run.code)}`;
    const value = data.get(key) ?? { total: 0, unknown: 0 };
    value.total++;
    if (verdictLabel(lastVerdict(run)) === "UNKNOWN") value.unknown++;
    data.set(key, value);
  }
  return [...data].map(([pair, v]) => ({ pair, ...v }));
}

export function runsNeedingReview(runs: readonly Run[]): Run[] {
  return runs.filter((r) => (r.gold_label && r.gold_label !== lastVerdict(r)) || verdictLabel(lastVerdict(r)) === "UNKNOWN");
}

/** Số run theo nhóm verdict (verdict cuối), cho biểu đồ tròn. */
export function countByVerdictClass(byVerdict: Record<string, number> | undefined): Array<{ key: (typeof VERDICT_CLASSES)[number]; value: number }> {
  const totals: Record<string, number> = Object.fromEntries(VERDICT_CLASSES.map((c) => [c, 0]));
  for (const [verdict, n] of Object.entries(byVerdict ?? {})) {
    const label = verdictLabel(verdict);
    if (label in totals) totals[label] = (totals[label] ?? 0) + n;
  }
  return VERDICT_CLASSES.map((key) => ({ key, value: totals[key] ?? 0 }));
}
