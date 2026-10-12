import { describe, it, expect } from "vitest";
import { POST as handleAnswer } from "@/app/api/tickets/[id]/answer/route";
import { NextRequest } from "next/server";

describe("API Route: /api/tickets/[id]/answer (Single-shot 409 enforcement)", () => {
  it("allows first answer submission and returns 200 OK", async () => {
    const req = new NextRequest("http://localhost:3000/api/tickets/ticket_und_ev_1/answer", {
      method: "POST",
      body: JSON.stringify({ answer: "mock_output", durationMs: 1500 }),
    });

    const res = await handleAnswer(req, {
      params: Promise.resolve({ id: "ticket_und_ev_1" }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.ticket.status).toBe("spent");
  });

  it("REJECTS second answer submission with HTTP 409 Conflict", async () => {
    // Attempting to answer ticket_und_ev_1 a second time
    const req = new NextRequest("http://localhost:3000/api/tickets/ticket_und_ev_1/answer", {
      method: "POST",
      body: JSON.stringify({ answer: "second_attempt" }),
    });

    const res = await handleAnswer(req, {
      params: Promise.resolve({ id: "ticket_und_ev_1" }),
    });

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.code).toBe("TICKET_ALREADY_SPENT");
  });

  it("POST /api/tickets/[id]/defer defers ticket while keeping status open", async () => {
    const { POST: handleDefer } = await import("@/app/api/tickets/[id]/defer/route");
    const req = new NextRequest("http://localhost:3000/api/tickets/ticket_und_ev_1/defer", {
      method: "POST",
    });

    const res = await handleDefer(req, {
      params: Promise.resolve({ id: "ticket_und_ev_1" }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.status).toBe("open");
  });
});

