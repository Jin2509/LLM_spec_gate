/**
 * tests/api/admission-sse.test.ts — Server-Sent Events (SSE) Stream & Resumption Test
 *
 * Requirements:
 *   - SSE với seq tăng dần (id: <seq>).
 *   - Ngắt kết nối và nối lại với Last-Event-ID không bị mất hoặc trùng sự kiện.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { GET as handleEvents } from "@/app/api/runs/[id]/events/route";
import { mockRunStore } from "@/mock/runs";
import { NextRequest } from "next/server";

describe("SSE API: /api/runs/[id]/events", () => {
  beforeEach(() => {
    mockRunStore._resetForTesting();
  });

  it("streams all initial events with sequential seq numbers from 1", async () => {
    const req = new NextRequest("http://localhost:3000/api/runs/run_evalplus_01/events");
    const res = await handleEvents(req, {
      params: Promise.resolve({ id: "run_evalplus_01" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");

    const text = await res.text();
    // Parse SSE lines
    const idMatches = [...text.matchAll(/id:\s*(\d+)/g)].map((m) => parseInt(m[1]!, 10));

    expect(idMatches.length).toBeGreaterThanOrEqual(8);
    expect(idMatches[0]).toBe(1);
    expect(idMatches[1]).toBe(2);
    expect(idMatches[2]).toBe(3);
  });

  it("RESUMPTION: reconnecting with Last-Event-ID resumes strictly after last seen seq without duplicates or gaps", async () => {
    // Client disconnects after seeing event seq: 3
    const lastSeenId = "3";
    const req = new NextRequest(
      "http://localhost:3000/api/runs/run_evalplus_01/events",
      {
        headers: {
          "Last-Event-ID": lastSeenId,
        },
      }
    );

    const res = await handleEvents(req, {
      params: Promise.resolve({ id: "run_evalplus_01" }),
    });

    expect(res.status).toBe(200);
    const text = await res.text();
    const idMatches = [...text.matchAll(/id:\s*(\d+)/g)].map((m) => parseInt(m[1]!, 10));

    // Must NOT contain seq 1, 2, 3
    expect(idMatches).not.toContain(1);
    expect(idMatches).not.toContain(2);
    expect(idMatches).not.toContain(3);

    // First event received must be exactly seq 4
    expect(idMatches[0]).toBe(4);

    // Sequence must be strictly monotonic
    for (let i = 1; i < idMatches.length; i++) {
      expect(idMatches[i]).toBe(idMatches[i - 1]! + 1);
    }
  });

  it("returns 404 for non-existent run ID", async () => {
    const req = new NextRequest("http://localhost:3000/api/runs/non_existent_run/events");
    const res = await handleEvents(req, {
      params: Promise.resolve({ id: "non_existent_run" }),
    });

    expect(res.status).toBe(404);
  });
});
