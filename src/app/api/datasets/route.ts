import { NextResponse } from "next/server";
import { ACADEMIC_TASKS } from "@/mock/fixtures/academic-tasks";
import { stripGrading } from "@/guard/grading-proxy";

export async function GET() {
  // Always strip grading before sending out to client
  const safeData = stripGrading({
    datasets: [
      {
        id: "evalplus_illustrative",
        name: "EvalPlus Tập Minh Họa (12 bài)",
        taskCount: ACADEMIC_TASKS.length,
        tasks: ACADEMIC_TASKS,
      },
    ],
  });

  return NextResponse.json(safeData);
}
