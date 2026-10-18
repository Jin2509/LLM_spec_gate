/**
 * src/app/api/runs/route.ts — Run Initialization Endpoint
 *
 * Requirements:
 *   - Khởi tạo run, chia tỷ lệ Run/Held-out tất định bằng seed.
 */
import { NextRequest, NextResponse } from "next/server";
import { mockRunStore } from "@/mock/runs";
import { stripGrading } from "@/guard/grading-proxy";
import { createEvaluationRun, deleteEvaluationRuns, listEvaluationRuns } from "@/core/evaluation-store";
import type { Run } from "@/core/evaluation-types";


export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  let runs = await listEvaluationRuns();
  const verdict = params.get("verdict");
  const problem = params.get("problem");
  const dataset = params.get("dataset");
  const from = params.get("from");
  const to = params.get("to");
  const match = (value: string, filter: string | null) => !filter || value.toLowerCase().includes(filter.toLowerCase());
  runs = runs.filter((run) => match(run.verdicts.at(-1) ?? "", verdict) && match(run.problem_id + run.problem, problem) && match(run.dataset.id, dataset) && (!from || run.created_at >= from) && (!to || run.created_at <= to));
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? 25)));
  return NextResponse.json({ total: runs.length, page, pageSize, runs: runs.slice((page - 1) * pageSize, page * pageSize) });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (body?.confirmation !== "XOA LICH SU") return NextResponse.json({ error: "Cần xác nhận bằng cụm XOA LICH SU." }, { status: 400 });
  await deleteEvaluationRuns();
  return NextResponse.json({ deleted: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body?.mode === "evaluation") {
      const now = new Date().toISOString();
      const run: Run = {
        run_id: crypto.randomUUID(), created_at: now, updated_at: now,
        dataset: { id: String(body.datasetId ?? "evalplus_illustrative"), version: String(body.datasetVersion ?? "12 bài · mock") },
        problem_id: String(body.problemId ?? "custom"), problem: String(body.problem ?? ""),
        turns: [{ id: crypto.randomUUID(), role: "user", content: String(body.problem ?? ""), at: now }], verdicts: [], latency: {}, status: "queued",
      };
      await createEvaluationRun(run);
      return NextResponse.json({ run }, { status: 201 });
    }
    const { datasetId = "evalplus_illustrative", seed = `seed_${Date.now()}`, heldOutRatio = 0.2 } = body;

    if (heldOutRatio <= 0 || heldOutRatio >= 1) {
      return NextResponse.json(
        { error: "Tỷ lệ held-out phải lớn hơn 0 và nhỏ hơn 1." },
        { status: 400 }
      );
    }

    const manifest = mockRunStore.createRun({
      datasetId,
      seed,
      heldOutRatio,
    });

    return NextResponse.json(stripGrading(manifest), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: `Lỗi khi khởi tạo run: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
