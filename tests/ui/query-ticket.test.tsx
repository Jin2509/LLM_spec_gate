import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { QueryTicket } from "@/ui/domain/QueryTicket";
import type { HumanQueryTicket } from "@/core/types";

describe("QueryTicket Component", () => {
  const mockTicket: HumanQueryTicket = {
    id: "ticket_01",
    caseId: "case_01",
    witness: [2, 3],
    codeOutput: 6,
    status: "open",
    questionType: "expected-output",
    promptText: "Giá trị đầu ra mong đợi tại witness [2, 3] là bao nhiêu?",
  };

  it("submits answer and calls onAnswer", async () => {
    const handleAnswer = vi.fn().mockResolvedValue(undefined);
    const handleUncertain = vi.fn().mockResolvedValue(undefined);

    render(
      <QueryTicket
        ticket={mockTicket}
        onAnswer={handleAnswer}
        onUncertain={handleUncertain}
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "5" } });

    const submitBtn = screen.getByRole("button", { name: "Gửi câu trả lời" });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(handleAnswer).toHaveBeenCalledWith("5");
  });

  it("calls onUncertain when 'Không xác định được' is clicked", async () => {
    const handleAnswer = vi.fn().mockResolvedValue(undefined);
    const handleUncertain = vi.fn().mockResolvedValue(undefined);

    render(
      <QueryTicket
        ticket={mockTicket}
        onAnswer={handleAnswer}
        onUncertain={handleUncertain}
      />
    );

    const uncertainBtn = screen.getByRole("button", {
      name: "Không xác định được",
    });
    await act(async () => {
      fireEvent.click(uncertainBtn);
    });

    expect(handleUncertain).toHaveBeenCalled();
  });

  it("displays spent stamp and disables buttons when ticket is spent", () => {
    const spentTicket: HumanQueryTicket = {
      ...mockTicket,
      status: "spent",
      answer: "5",
    };

    render(
      <QueryTicket
        ticket={spentTicket}
        onAnswer={vi.fn()}
        onUncertain={vi.fn()}
      />
    );

    expect(screen.getByTestId("spent-stamp")).not.toBeNull();
    const submitBtn = screen.getByRole("button", { name: "Gửi câu trả lời" });
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true);
  });
});
