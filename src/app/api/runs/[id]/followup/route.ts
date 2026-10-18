import { NextRequest, NextResponse } from "next/server";
import { updateEvaluationRun } from "@/core/evaluation-store";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  if (typeof body?.content !== "string" || !body.content.trim()) return NextResponse.json({ error: "Nội dung bổ sung không được để trống." }, { status: 400 });
  let rejected = false;
  const run = await updateEvaluationRun(id, (current) => {
    if (current.turns.some((turn) => turn.role === "user" && current.turns.indexOf(turn) > 0)) { rejected = true; return current; }
    const now = new Date().toISOString();
    return { ...current, updated_at: now, status: "followup", turns: [...current.turns, { id: crypto.randomUUID(), role: "user", content: body.content.trim(), at: now }], verdicts: [...current.verdicts], logs: [...(current.logs ?? []), { id: crypto.randomUUID(), at: now, level: "info", message: "Đã nhận một lượt bổ sung." }] };
  });
  if (!run) return NextResponse.json({ error: "Không tìm thấy phiên chạy." }, { status: 404 });
  if (rejected) return NextResponse.json({ error: "Lượt bổ sung đã được sử dụng." }, { status: 409 });
  return NextResponse.json({ run });
}
