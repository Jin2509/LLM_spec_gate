/**
 * src/app/api/runs/[id]/lock-heldout/route.ts — Lock Held-out Split
 *
 * Requirements:
 *   - Khóa vĩnh viễn tập held-out của run qua heldOutRegistry.
 *   - Sau khi khóa, không có cách nào sửa đổi.
 */
import { NextRequest, NextResponse } from "next/server";
import { mockRunStore } from "@/mock/runs";
import { stripGrading } from "@/guard/grading-proxy";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = mockRunStore.lockHeldOut(id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: `Tập held-out của run "${id}" đã được khóa cứng vĩnh viễn.`,
    manifest: stripGrading(result.manifest),
  });
}
