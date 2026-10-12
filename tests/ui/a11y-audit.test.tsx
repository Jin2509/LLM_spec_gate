import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { DocketStrip } from "@/ui/domain/DocketStrip";
import { QueryTicket } from "@/ui/domain/QueryTicket";
import type { StageInfo, HumanQueryTicket } from "@/core/types";

describe("Accessibility & Keyboard Navigation (S15)", () => {
  const dummyStages: StageInfo[] = [
    { id: 1, name: "Bằng chứng", status: "done" },
    { id: 2, name: "Trạng thái c", status: "done" },
    { id: 3, name: "Luật R1-R6", status: "done" },
    { id: 4, name: "Hành động", status: "done" },
    { id: 5, name: "Sửa đặc tả", status: "running" },
    { id: 6, name: "Cổng Gate", status: "pending" },
  ];

  const dummyTicket: HumanQueryTicket = {
    id: "ticket_a11y_1",
    caseId: "case_01",
    witness: [2, 3],
    codeOutput: 5,
    status: "open",
    questionType: "expected-output",
    promptText: "Giá trị đầu ra mong đợi là bao nhiêu?",
  };

  it("ensures DocketStrip stages are keyboard navigable with left-to-right tabIndex and aria-labels", () => {
    render(<DocketStrip caseId="case_01" evalId={1} stages={dummyStages} />);

    // Each stage must have tabIndex = 0 and role group
    for (let id = 1; id <= 6; id++) {
      const stage = screen.getByTestId(`docket-stage-${id}`);
      expect(stage.getAttribute("tabIndex")).toBe("0");
      expect(stage.getAttribute("role")).toBe("group");
      expect(stage.getAttribute("aria-label")).toContain(`Chặng ${id}`);
    }
  });

  it("ensures QueryTicket has aria-live='polite' region for dynamic updates", () => {
    render(
      <QueryTicket
        ticket={dummyTicket}
        onAnswer={vi.fn()}
        onUncertain={vi.fn()}
      />
    );

    const ticketRegion = screen.getByTestId("query-ticket");
    expect(ticketRegion.getAttribute("aria-live")).toBe("polite");
    expect(ticketRegion.getAttribute("role")).toBe("region");
  });
});
