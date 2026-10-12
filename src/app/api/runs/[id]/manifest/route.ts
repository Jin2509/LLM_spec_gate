/**
 * src/app/api/runs/[id]/manifest/route.ts — Run Manifest Endpoint
 */
import { NextRequest, NextResponse } from "next/server";
import { mockRunStore } from "@/mock/runs";
import { stripGrading } from "@/guard/grading-proxy";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const manifest = mockRunStore.getRun(id);

  if (!manifest) {
    return NextResponse.json(
      { error: `Run "${id}" không tồn tại.` },
      { status: 404 }
    );
  }

  return NextResponse.json(stripGrading(manifest));
}
