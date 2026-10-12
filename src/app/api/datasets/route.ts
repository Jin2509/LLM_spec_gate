/**
 * src/app/api/datasets/route.ts — Dataset List & JSONL Upload Endpoint
 *
 * Requirements:
 *   - GET: Trả về danh sách datasets, lọc bỏ grading qua stripGrading().
 *   - POST: Parse upload .jsonl, kiểm tra Zod, báo lỗi chi tiết theo dòng.
 */
import { NextRequest, NextResponse } from "next/server";
import { ACADEMIC_TASKS } from "@/mock/fixtures/academic-tasks";
import { stripGrading } from "@/guard/grading-proxy";
import { AcademicTaskSchema } from "@/core/schema";

export async function GET() {
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

export async function POST(request: NextRequest) {
  try {
    const text = await request.text();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Nội dung tệp JSONL tải lên rỗng." },
        { status: 400 }
      );
    }

    const lines = text.split("\n");
    const errors: Array<{ line: number; message: string; field?: string }> = [];
    const validTasks: unknown[] = [];

    lines.forEach((rawLine, index) => {
      const lineNum = index + 1;
      const trimmed = rawLine.trim();
      if (!trimmed) return; // Skip empty lines

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(trimmed);
      } catch (err) {
        errors.push({
          line: lineNum,
          message: `Lỗi cú pháp JSON ở dòng ${lineNum}: ${(err as Error).message}`,
        });
        return;
      }

      const parseResult = AcademicTaskSchema.safeParse(parsedJson);
      if (!parseResult.success) {
        const issue = parseResult.error.issues[0];
        errors.push({
          line: lineNum,
          field: issue?.path.join(".") || "unknown",
          message: `Dòng ${lineNum}: ${issue?.message || "Dữ liệu không khớp schema"}`,
        });
      } else {
        validTasks.push(parseResult.data);
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          totalLines: lines.length,
          validCount: validTasks.length,
          errorCount: errors.length,
          errors,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Tải lên thành công ${validTasks.length} task từ tệp JSONL.`,
        taskCount: validTasks.length,
        tasks: validTasks,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: `Lỗi máy chủ khi xử lý JSONL: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
