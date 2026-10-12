import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CallFeed, type CallTraceItem } from "@/ui/domain/CallFeed";

describe("CallFeed Virtualized List & Status Badges", () => {
  const mockItems: CallTraceItem[] = [
    {
      id: "call_1",
      caseId: "case_01",
      callIndex: 1,
      functionName: "fn_sort",
      inputPreview: "[5, 3]",
      status: "ACC",
      timestamp: "2026-10-12T00:00:00Z",
    },
    {
      id: "call_2",
      caseId: "case_02",
      callIndex: 2,
      functionName: "fn_parse",
      inputPreview: "'abc'",
      status: "REJ",
      timestamp: "2026-10-12T00:00:00Z",
    },
    {
      id: "call_3",
      caseId: "case_03",
      callIndex: 3,
      functionName: "fn_search",
      inputPreview: "10",
      status: "UNKNOWN",
      timestamp: "2026-10-12T00:00:00Z",
    },
    {
      id: "call_4",
      caseId: "case_04",
      callIndex: 4,
      functionName: "fn_matrix",
      inputPreview: "[[1]]",
      status: "PRE_VIOLATION",
      timestamp: "2026-10-12T00:00:00Z",
    },
    {
      id: "call_5",
      caseId: "case_05",
      callIndex: 5,
      functionName: "fn_tree",
      inputPreview: "node",
      status: "CONTRACT_ERROR",
      timestamp: "2026-10-12T00:00:00Z",
    },
    {
      id: "call_6",
      caseId: "case_06",
      callIndex: 6,
      functionName: "fn_race",
      inputPreview: "thread",
      status: "FLAKY",
      timestamp: "2026-10-12T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      width: 300,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 600,
    });
  });

  it("renders status badges with appropriate semantics", () => {
    const handleSelect = vi.fn();
    render(
      <CallFeed
        items={mockItems}
        selectedCallId="call_1"
        onSelectCall={handleSelect}
      />
    );

    expect(screen.getByText("Qua (ACC)")).toBeDefined();
    expect(screen.getByText("Bác (REJ)")).toBeDefined();
    expect(screen.getByText("Chưa rõ (UND)")).toBeDefined();
    expect(screen.getByText("PRE_VIOLATION")).toBeDefined();
    expect(screen.getByText("CONTRACT_ERROR")).toBeDefined();
    expect(screen.getByText("FLAKY")).toBeDefined();
  });

  it("assigns neutral tooltip 'Ghi log, không phân xử' to PRE_VIOLATION, CONTRACT_ERROR, FLAKY", () => {
    const handleSelect = vi.fn();
    render(
      <CallFeed
        items={mockItems}
        selectedCallId="call_1"
        onSelectCall={handleSelect}
      />
    );

    const preViolBadge = screen.getByTestId("status-badge-PRE_VIOLATION");
    expect(preViolBadge.getAttribute("title")).toBe("Ghi log, không phân xử");

    const contractErrBadge = screen.getByTestId("status-badge-CONTRACT_ERROR");
    expect(contractErrBadge.getAttribute("title")).toBe("Ghi log, không phân xử");

    const flakyBadge = screen.getByTestId("status-badge-FLAKY");
    expect(flakyBadge.getAttribute("title")).toBe("Ghi log, không phân xử");
  });

  it("calls onSelectCall when clicking an item", () => {
    const handleSelect = vi.fn();
    render(
      <CallFeed
        items={mockItems}
        selectedCallId="call_1"
        onSelectCall={handleSelect}
      />
    );

    const item2 = screen.getByTestId("call-item-call_2");
    fireEvent.click(item2);
    expect(handleSelect).toHaveBeenCalledWith("call_2", "case_02");
  });
});
