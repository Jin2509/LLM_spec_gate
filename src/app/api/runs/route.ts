/**
 * src/app/api/runs/route.ts — Run Initialization Endpoint
 *
 * Requirements:
 *   - Khởi tạo run, chia tỷ lệ Run/Held-out tất định bằng seed.
 */
import { NextRequest, NextResponse } from "next/server";
import { mockRunStore } from "@/mock/runs";
import { stripGrading } from "@/guard/grading-proxy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
