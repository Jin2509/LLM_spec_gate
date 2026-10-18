import { NextResponse } from "next/server";
import { ACADEMIC_TASKS } from "@/mock/fixtures/academic-tasks";
import { DEFAULT_DATASET } from "@/config/dataset";
import type { Problem } from "@/core/evaluation-types";

export async function GET() {
  const problems: Problem[] = ACADEMIC_TASKS.map((task) => ({
    id: task.id, title: task.name, prompt: task.intentDocstring,
    group: task.anchorLevel, difficulty: task.outputType,
  }));
  return NextResponse.json({ datasetId: DEFAULT_DATASET, problems });
}
