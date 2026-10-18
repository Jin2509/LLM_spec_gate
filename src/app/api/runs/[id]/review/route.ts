import { NextRequest, NextResponse } from "next/server";
import { updateEvaluationRun } from "@/core/evaluation-store";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  if (typeof body?.agree !== "boolean" || typeof body?.note !== "string") return NextResponse.json({ error: "Cần agree kiểu boolean và note kiểu chuỗi." }, { status: 400 });
  const run = await updateEvaluationRun(id, (current) => ({ ...current, updated_at: new Date().toISOString(), review: { agree: body.agree, note: body.note, at: new Date().toISOString() } }));
  return run ? NextResponse.json({ run }) : NextResponse.json({ error: "Không tìm thấy phiên chạy." }, { status: 404 });
}
