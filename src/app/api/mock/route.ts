/**
 * src/app/api/mock/route.ts
 *
 * Mock API Route — Server-Sent Events stream for offline/local development.
 *
 * Emits deterministic adjudication events from src/mock/fixtures/engine.ts.
 * Used by feature components during development without a real backend.
 *
 * Endpoints (planned S2):
 *   GET  /api/mock/stream      — SSE stream of witness + verdict events
 *   POST /api/mock/query/:id   — Respond to a human query ticket
 *   POST /api/mock/reset       — Reset fixture state to initial seed
 *
 * IMPORTANT: This route must never be bundled into production builds.
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { status: "mock-api-placeholder", note: "Implement in S2" },
    { status: 200 },
  );
}
