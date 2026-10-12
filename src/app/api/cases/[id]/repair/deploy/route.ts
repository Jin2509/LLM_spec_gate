/**
 * src/app/api/cases/[id]/repair/deploy/route.ts — Deploy Repair Candidate
 *
 * Requirements:
 *   - Evaluates repair candidate via Gate checks G1–G5.
 *   - Returns gate outcome and upgraded monitor version.
 */
import { NextRequest, NextResponse } from "next/server";
import { mockRunStore } from "@/mock/runs";
import { SAMPLE_CASES } from "@/mock/fixtures/sample-cases";
import { stripGrading } from "@/guard/grading-proxy";
import type { RepairCandidate } from "@/core/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dossier = SAMPLE_CASES[id];

  if (!dossier) {
    return NextResponse.json(
      { error: `Hồ sơ vụ việc "${id}" không tồn tại.` },
      { status: 404 }
    );
  }

  let bodyCandidate: RepairCandidate | undefined;
  let policy: "strict" | "standard" | "shadow" = "standard";
  let isProofVerified = true;
  let hasA2Anchor = true;

  try {
    const body = await request.json();
    bodyCandidate = body.repairCandidate;
    if (body.policy) policy = body.policy;
    if (typeof body.isProofVerified === "boolean") isProofVerified = body.isProofVerified;
    if (typeof body.hasA2Anchor === "boolean") hasA2Anchor = body.hasA2Anchor;
  } catch {
    // Optional candidate in body; fallback to dossier candidate
  }

  const candidate = bodyCandidate || dossier.repairCandidate;
  if (!candidate) {
    return NextResponse.json(
      { error: `Vụ việc "${id}" không có ứng viên sửa đặc tả (repair candidate) để deploy.` },
      { status: 400 }
    );
  }

  const result = mockRunStore.deployRepair(id, candidate, policy, { isProofVerified, hasA2Anchor });

  return NextResponse.json(stripGrading({
    success: result.success,
    caseId: id,
    policy,
    passMode: result.passMode,
    policyDecision: result.policyDecision,
    isShadowOnly: result.isShadowOnly,
    gateResult: result.gateResult,
    previousMonitorVersion: dossier.currentMonitorVersion,
    activeMonitorVersion: result.nextMonitorVersion,
  }));
}
