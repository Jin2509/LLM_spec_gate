import { NextRequest, NextResponse } from "next/server";
import { listEvaluationRuns } from "@/core/evaluation-store";
import { calculateRunMetrics } from "@/core/evaluation-metrics";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  let runs = await listEvaluationRuns();
  const dataset = params.get("dataset");
  const verdict = params.get("verdict");
  const from = params.get("from");
  const to = params.get("to");
  runs = runs.filter((run) => (!dataset || run.dataset.id === dataset) && (!verdict || String(run.verdicts.at(-1) ?? "").includes(verdict)) && (!from || run.created_at >= from) && (!to || run.created_at <= to));
  return NextResponse.json({ metrics: calculateRunMetrics(runs), runs });
}
