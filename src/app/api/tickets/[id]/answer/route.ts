import { NextRequest, NextResponse } from "next/server";
import { SAMPLE_CASES } from "@/mock/fixtures/sample-cases";
import { answerTicket, TicketAlreadySpentError } from "@/core/ticket";
import { stripGrading } from "@/guard/grading-proxy";

// In-memory state tracking for single-shot query tickets across requests
const ticketStore = new Map<string, { status: "unused" | "open" | "spent"; answer?: unknown }>();

// Initialize store with sample tickets
for (const c of Object.values(SAMPLE_CASES)) {
  if (c.ticket) {
    ticketStore.set(c.ticket.id, { status: c.ticket.status, answer: c.ticket.answer });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const current = ticketStore.get(id);

  if (!current) {
    return NextResponse.json(
      { error: `Vé hỏi "${id}" không tồn tại` },
      { status: 404 }
    );
  }

  // ── SINGLE-SHOT ENFORCEMENT: Return 409 if already spent ──────────────────
  if (current.status === "spent") {
    return NextResponse.json(
      {
        error: `Vé hỏi "${id}" đã được sử dụng trước đó (spent). Nghiêm cấm gửi lần hai theo nguyên tắc bài báo.`,
        code: "TICKET_ALREADY_SPENT",
      },
      { status: 409 }
    );
  }

  let body: { answer: unknown; durationMs?: number };
  try {
    body = await request.json();
  } catch {
    body = { answer: true };
  }

  try {
    // Transition ticket to spent
    const updated = answerTicket(
      {
        id,
        caseId: "mock_case",
        witness: null,
        codeOutput: null,
        status: current.status,
        questionType: "expected-output",
        promptText: "Mock prompt",
      },
      body.answer,
      body.durationMs
    );

    ticketStore.set(id, { status: "spent", answer: body.answer });

    return NextResponse.json(
      stripGrading({
        success: true,
        ticket: updated,
        message: "Vé hỏi đã được sử dụng và khóa vĩnh viễn (status: spent).",
      })
    );
  } catch (err: unknown) {
    if (err instanceof TicketAlreadySpentError) {
      return NextResponse.json(
        { error: err.message, code: "TICKET_ALREADY_SPENT" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Lỗi xử lý vé hỏi" },
      { status: 500 }
    );
  }
}
