import { NextRequest, NextResponse } from "next/server";
import { SAMPLE_CASES } from "@/mock/fixtures/sample-cases";
import { stripGrading } from "@/guard/grading-proxy";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dossier = SAMPLE_CASES[id];

  if (!dossier) {
    return NextResponse.json(
      { error: `Hồ sơ vụ việc "${id}" không tồn tại` },
      { status: 404 }
    );
  }

  // Guarantee zero grading leakage to client
  const safeDossier = stripGrading(dossier);
  return NextResponse.json(safeDossier);
}
