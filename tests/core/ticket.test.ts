import { describe, it, expect } from "vitest";
import {
  createTicket,
  openTicket,
  answerTicket,
  deferTicket,
  markUncertain,
  TicketAlreadySpentError,
  TicketCreationForbiddenError,
} from "@/core/ticket";

describe("Single-Shot Human Query Ticket (ticket.ts)", () => {
  it("creates ticket in 'unused' state for UNKNOWN_EVIDENCE", () => {
    const ticket = createTicket({
      id: "t1",
      caseId: "c1",
      witness: [1, 2],
      codeOutput: 3,
      verdict: "UNKNOWN_EVIDENCE",
      questionType: "expected-output",
      promptText: "What is the expected output?",
    });

    expect(ticket.status).toBe("unused");
  });

  it("FORBIDS ticket creation for UNKNOWN_GATE", () => {
    expect(() =>
      createTicket({
        id: "t_gate",
        caseId: "c_gate",
        witness: [5],
        codeOutput: 10,
        verdict: "UNKNOWN_GATE",
        questionType: "expected-output",
        promptText: "Test",
      })
    ).toThrowError(TicketCreationForbiddenError);
  });

  it("transitions unused -> open -> spent", () => {
    const t0 = createTicket({
      id: "t2",
      caseId: "c2",
      witness: [10],
      codeOutput: 20,
      verdict: "UNKNOWN_CONFLICT",
      questionType: "expected-output",
      promptText: "Conflict resolution",
    });

    const t1 = openTicket(t0);
    expect(t1.status).toBe("open");

    const t2 = answerTicket(t1, 42, 1200);
    expect(t2.status).toBe("spent");
    expect(t2.answer).toBe(42);
    expect(t2.responseDurationMs).toBe(1200);
  });

  it("THROWS TicketAlreadySpentError when trying to answer a spent ticket second time (Single-shot!)", () => {
    const t0 = createTicket({
      id: "t3",
      caseId: "c3",
      witness: [1],
      codeOutput: 2,
      verdict: "UNKNOWN_EVIDENCE",
      questionType: "expected-output",
      promptText: "Question",
    });

    const openT = openTicket(t0);
    const spentT = answerTicket(openT, "first_answer");

    // Second submission must be rejected
    expect(() => answerTicket(spentT, "second_answer")).toThrowError(
      TicketAlreadySpentError
    );
  });

  it("deferTicket keeps ticket in 'open' state (S key in focus mode)", () => {
    const t0 = createTicket({
      id: "t4",
      caseId: "c4",
      witness: [3],
      codeOutput: 4,
      verdict: "UNKNOWN_EVIDENCE",
      questionType: "acceptability",
      promptText: "Is output acceptable?",
    });

    const openT = openTicket(t0);
    const deferredT = deferTicket(openT);
    expect(deferredT.status).toBe("open");
  });

  it("markUncertain consumes ticket as 'spent' with isUncertain: true (C key in focus mode)", () => {
    const t0 = createTicket({
      id: "t5",
      caseId: "c5",
      witness: [3],
      codeOutput: 4,
      verdict: "UNKNOWN_EVIDENCE",
      questionType: "expected-output",
      promptText: "Value?",
    });

    const openT = openTicket(t0);
    const uncertainT = markUncertain(openT);
    expect(uncertainT.status).toBe("spent");
    expect(uncertainT.isUncertain).toBe(true);

    // Cannot answer after being marked uncertain
    expect(() => answerTicket(uncertainT, 100)).toThrowError(
      TicketAlreadySpentError
    );
  });
});
