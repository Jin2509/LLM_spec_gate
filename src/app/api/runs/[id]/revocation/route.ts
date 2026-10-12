/**
 * src/app/api/runs/[id]/revocation/route.ts — Revocation & Fault Injection API
 */
import { NextRequest, NextResponse } from "next/server";
import { mockRunStore } from "@/mock/runs";
import { stripGrading } from "@/guard/grading-proxy";
import type { BadTraceItem } from "@/core/revocation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const history = mockRunStore.getMonitorHistory(id);

  return NextResponse.json(
    stripGrading({
      runId: id,
      monitorHistory: history,
    })
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let trace: BadTraceItem;
  try {
    const body = await request.json();
    trace = body.trace;
  } catch {
    // Default bad trace if body empty
    trace = {
      id: `injected_bad_${Date.now()}`,
      input: [5, 3, 2, 8],
      output: [8, 5, 3, 2],
      inGuard: true,
      description: "Vết xấu mô phỏng xâm phạm vùng guard g (ret vi phạm thứ tự).",
      injectedAt: new Date().toISOString(),
    };
  }

  const result = mockRunStore.injectBadTrace(id, trace);

  return NextResponse.json(
    stripGrading({
      success: true,
      revocationResult: result,
      currentHistory: mockRunStore.getMonitorHistory(id),
    })
  );
}
