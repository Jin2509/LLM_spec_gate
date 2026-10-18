import { NextResponse } from "next/server";
import { getEvaluationRun, updateEvaluationRun } from "@/core/evaluation-store";
import { NextRequest } from "next/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const run = await getEvaluationRun(id);
  return run ? NextResponse.json({ run }) : NextResponse.json({ error: "Không tìm thấy phiên chạy." }, { status: 404 });
}
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const run = await updateEvaluationRun(id, (current) => {
    const now = new Date().toISOString();
    const log = typeof body.log === "string" ? [{ id: crypto.randomUUID(), at: now, level: body.level === "error" ? "error" as const : body.level === "warn" ? "warn" as const : "info" as const, message: body.log }] : [];
    return { ...current, ...body.patch, updated_at: now, turns: body.turn ? [...current.turns, { ...body.turn, id: crypto.randomUUID(), at: now }] : current.turns, verdicts: body.verdict ? [...current.verdicts, body.verdict] : current.verdicts, latency: body.latency ? { ...current.latency, ...body.latency } : current.latency, logs: [...(current.logs ?? []), ...log] };
  });
  return run ? NextResponse.json({ run }) : NextResponse.json({ error: "Không tìm thấy phiên chạy." }, { status: 404 });
}
