import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryTicket } from "@/ui/domain/QueryTicket";
import type { HumanQueryTicket } from "@/core/types";

describe("QueryTicket Interaction & UNKNOWN_GATE Guard", () => {
  const mockTicket: HumanQueryTicket = {
    id: "ticket_test_01",
    caseId: "case_01",
    witness: [1, 2, 3],
    codeOutput: 6,
    status: "open",
    questionType: "expected-output",
    promptText: "Đầu ra kỳ vọng e(w) là gì?",
  };

  it("DISALLOWS ticket creation/submission for UNKNOWN_GATE with explicit tooltip explanation", () => {
    const handleAnswer = vi.fn();
    const handleUncertain = vi.fn();

    render(
      <QueryTicket
        ticket={mockTicket}
        verdict="UNKNOWN_GATE"
        onAnswer={handleAnswer}
        onUncertain={handleUncertain}
      />
    );

    // Tooltip / warning message must be clearly visible
    const tooltip = screen.getByTestId("unknown-gate-tooltip");
    expect(tooltip).toBeDefined();
    expect(tooltip.textContent).toContain("cấm tạo vé hỏi người");
    expect(tooltip.textContent).toContain("vấn đề nằm ở bản sửa đặc tả (repair)");

    // Input must be disabled
    const input = screen.getByPlaceholderText(/Ví dụ: 42/) as HTMLInputElement;
    expect(input.disabled).toBe(true);

    // Submit button must be disabled
    const submitBtn = screen.getByRole("button", { name: /Gửi câu trả lời/ }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it("ALLOWS ticket submission for UNKNOWN_EVIDENCE or UNKNOWN_CONFLICT", () => {
    const handleAnswer = vi.fn();
    const handleUncertain = vi.fn();

    render(
      <QueryTicket
        ticket={mockTicket}
        verdict="UNKNOWN_EVIDENCE"
        isUniqueOutput={true}
        onAnswer={handleAnswer}
        onUncertain={handleUncertain}
      />
    );

    expect(screen.queryByTestId("unknown-gate-tooltip")).toBeNull();

    const input = screen.getByPlaceholderText(/Ví dụ: 42/) as HTMLInputElement;
    expect(input.disabled).toBe(false);
  });

  it("renders 3 distinct buttons for non-unique output (isUniqueOutput = false)", () => {
    const handleAnswer = vi.fn();
    const handleUncertain = vi.fn();

    render(
      <QueryTicket
        ticket={{ ...mockTicket, questionType: "acceptability" }}
        verdict="UNKNOWN_CONFLICT"
        isUniqueOutput={false}
        onAnswer={handleAnswer}
        onUncertain={handleUncertain}
      />
    );

    expect(screen.getByRole("button", { name: /\[1\] Chấp nhận/ })).toBeDefined();
    expect(screen.getByRole("button", { name: /\[2\] Không chấp nhận/ })).toBeDefined();
    expect(screen.getByRole("button", { name: /\[C\] Không xác định được/ })).toBeDefined();
  });
});
