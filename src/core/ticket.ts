/**
 * src/core/ticket.ts — Single-Shot Human Query Ticket State Machine
 *
 * Requirements:
 *   - Monotonic lifecycle: unused -> open -> spent
 *   - Any attempt to reverse state throws IllegalTicketTransitionError
 *   - Answering an already spent ticket throws TicketAlreadySpentError (HTTP 409)
 *   - UNKNOWN_GATE is strictly forbidden from creating tickets
 *   - Deferral keeps ticket 'open' (ticket goes to back of queue)
 *   - "Không xác định được" (uncertain) marks ticket as 'spent' with isUncertain: true
 */
import type { HumanQueryTicket, QuestionType, Verdict } from "./types";

export class IllegalTicketTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`[ticket-guard] Không thể chuyển trạng thái vé từ "${from}" sang "${to}"`);
    this.name = "IllegalTicketTransitionError";
  }
}

export class TicketAlreadySpentError extends Error {
  constructor(ticketId: string) {
    super(`[ticket-guard] Vé hỏi "${ticketId}" đã được sử dụng (spent). Nghiêm cấm gửi lần hai (HTTP 409).`);
    this.name = "TicketAlreadySpentError";
  }
}

export class TicketCreationForbiddenError extends Error {
  constructor(reason: string) {
    super(`[ticket-guard] Cấm tạo vé hỏi: ${reason}`);
    this.name = "TicketCreationForbiddenError";
  }
}

/**
 * Creates a new single-shot query ticket.
 * Enforces rule: UNKNOWN_GATE MUST NOT create tickets.
 */
export function createTicket(params: {
  id: string;
  caseId: string;
  witness: unknown;
  codeOutput: unknown;
  verdict: Verdict;
  questionType: QuestionType;
  promptText: string;
}): HumanQueryTicket {
  if (params.verdict === "UNKNOWN_GATE") {
    throw new TicketCreationForbiddenError(
      "UNKNOWN_GATE có bằng chứng đã đủ; vấn đề nằm ở bản sửa đặc tả (repair), cấm tạo vé hỏi người."
    );
  }

  if (params.verdict !== "UNKNOWN_EVIDENCE" && params.verdict !== "UNKNOWN_CONFLICT") {
    throw new TicketCreationForbiddenError(
      `Chỉ UNKNOWN_EVIDENCE và UNKNOWN_CONFLICT mới được tạo vé hỏi (nhận: ${params.verdict})`
    );
  }

  return {
    id: params.id,
    caseId: params.caseId,
    witness: params.witness,
    codeOutput: params.codeOutput,
    status: "unused",
    questionType: params.questionType,
    promptText: params.promptText,
  };
}

/**
 * Opens a ticket for human inspection (unused -> open)
 */
export function openTicket(ticket: HumanQueryTicket): HumanQueryTicket {
  if (ticket.status === "spent") {
    throw new TicketAlreadySpentError(ticket.id);
  }
  if (ticket.status === "open") {
    return ticket; // idempotent
  }
  return {
    ...ticket,
    status: "open",
  };
}

/**
 * Answers a ticket, permanently consuming it (open -> spent).
 * Throws TicketAlreadySpentError if already spent.
 */
export function answerTicket(
  ticket: HumanQueryTicket,
  answer: unknown,
  durationMs?: number
): HumanQueryTicket {
  if (ticket.status === "spent") {
    throw new TicketAlreadySpentError(ticket.id);
  }

  return {
    ...ticket,
    status: "spent",
    answer,
    isUncertain: false,
    answeredAt: new Date().toISOString(),
    responseDurationMs: durationMs,
  };
}

/**
 * Marks ticket as "Không xác định được" (intent mơ hồ).
 * Permanently consumes the ticket (open -> spent) with isUncertain: true.
 */
export function markUncertain(
  ticket: HumanQueryTicket,
  durationMs?: number
): HumanQueryTicket {
  if (ticket.status === "spent") {
    throw new TicketAlreadySpentError(ticket.id);
  }

  return {
    ...ticket,
    status: "spent",
    isUncertain: true,
    answeredAt: new Date().toISOString(),
    responseDurationMs: durationMs,
  };
}

/**
 * Defers a ticket in Focus Mode (S key): keeps status as 'open' so it can be visited later.
 */
export function deferTicket(ticket: HumanQueryTicket): HumanQueryTicket {
  if (ticket.status === "spent") {
    throw new TicketAlreadySpentError(ticket.id);
  }
  return {
    ...ticket,
    status: "open",
  };
}
