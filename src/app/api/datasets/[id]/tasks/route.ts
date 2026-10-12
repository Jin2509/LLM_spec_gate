/**
 * src/app/api/datasets/[id]/tasks/route.ts — Tasks within Dataset
 *
 * Requirements:
 *   - Lọc bỏ grading hoàn toàn bằng stripGrading().
 */
import { NextRequest, NextResponse } from "next/server";
import { ACADEMIC_TASKS } from "@/mock/fixtures/academic-tasks";
import { stripGrading } from "@/guard/grading-proxy";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (id !== "evalplus_illustrative") {
    return NextResponse.json(
      { error: `Tập dữ liệu "${id}" không tồn tại.` },
      { status: 404 }
    );
  }

  const safeTasks = stripGrading(ACADEMIC_TASKS);
  return NextResponse.json({
    datasetId: id,
    taskCount: safeTasks.length,
    tasks: safeTasks,
  });
}
