import { NextRequest, NextResponse } from "next/server";
import { listEvaluationRuns } from "@/core/evaluation-store";
import { calculateRunMetrics } from "@/core/evaluation-metrics";

const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
export async function GET(request: NextRequest) {
  const runs = await listEvaluationRuns();
  const format = request.nextUrl.searchParams.get("format") ?? "json";
  const date = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const dataset = runs[0]?.dataset.id ?? "evalplus_illustrative";
  if (format === "stats") return new NextResponse(JSON.stringify(calculateRunMetrics(runs), null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${dataset}-${date}-stats.json"` } });
  if (format === "csv") {
    const headers = ["run_id", "created_at", "dataset", "problem_id", "problem", "verdict", "confidence", "status", "gold_label", "review_agree", "review_note"];
    const rows = runs.map((run) => [run.run_id, run.created_at, run.dataset.id, run.problem_id, run.problem, run.verdicts.at(-1), run.confidence, run.status, run.gold_label, run.review?.agree, run.review?.note]);
    return new NextResponse([headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${dataset}-${date}.csv"` } });
  }
  return new NextResponse(JSON.stringify(runs, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${dataset}-${date}.json"` } });
}
