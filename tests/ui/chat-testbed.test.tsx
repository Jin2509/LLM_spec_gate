import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChatTestbed } from "@/ui/chat/ChatTestbed";

describe("ChatTestbed LLM-Style Interaction Testbed", () => {
  it("renders left sidebar with dataset selector, search input, and test cases", () => {
    render(<ChatTestbed initialCaseId="case_spec_fault" />);

    expect(screen.getByText("Dual-Oracle Testbed")).toBeDefined();
    expect(screen.getByLabelText("Dataset")).toBeDefined();
    expect(screen.getByPlaceholderText(/Tìm tác vụ, witness, hoặc ID/)).toBeDefined();

    // Verify task items in sidebar
    expect(screen.getByTestId("case-item-case_spec_fault")).toBeDefined();
    expect(screen.getByTestId("case-item-case_code_fault")).toBeDefined();
    expect(screen.getByTestId("case-item-case_und_evidence")).toBeDefined();
  });

  it("renders central stream with runner trigger, system output, and monitor evaluation", () => {
    render(<ChatTestbed initialCaseId="case_spec_fault" />);

    // Test runner trigger message
    expect(screen.getByText(/Kiểm Thử Viên \(Testbed Runner\)/)).toBeDefined();
    expect(screen.getByText(/w = \[5,3,2,8\]/)).toBeDefined();

    // Dual oracle monitor message
    expect(screen.getByText(/Giám Sát Song Hành \(Dual-Oracle Monitor\)/)).toBeDefined();
    expect(screen.getByText(/c = \[2,3,5,8\]/)).toBeDefined();
    expect(screen.getByText(/BÁC BỎ/)).toBeDefined();
    expect(screen.getByText(/SPEC_FAULT/)).toBeDefined();
  });

  it("renders single-shot prompt box for UNKNOWN case and locks upon answering", async () => {
    render(<ChatTestbed initialCaseId="case_und_evidence" />);

    // In-stream prompt box should be visible
    const promptBox = screen.getByTestId("chat-prompt-box");
    expect(promptBox).toBeDefined();
    expect(
      screen.getByText(/Phân cụm \[\[1\.2\], \[4\.5, 7\.8\]\] có chấp nhận được/)
    ).toBeDefined();

    // Accept button should be available
    const acceptBtn = screen.getByTestId("chat-ticket-accept-btn");
    expect(acceptBtn).toBeDefined();

    // Click Accept button
    fireEvent.click(acceptBtn);

    // Prompt box must immediately lock and stamp SPENT
    await waitFor(() => {
      expect(screen.getByTestId("chat-spent-stamp")).toBeDefined();
      expect(screen.getByText("ĐÃ SỬ DỤNG (SPENT)")).toBeDefined();
    });

    // Accept/Reject buttons should no longer be present
    expect(screen.queryByTestId("chat-ticket-accept-btn")).toBeNull();
  });

  it("keeps inspection drawer collapsed by default and opens on clicking inspect button", () => {
    render(<ChatTestbed initialCaseId="case_spec_fault" />);

    // Initially collapsed
    expect(screen.queryByTestId("inspection-drawer")).toBeNull();

    // Click inspect toggle button
    const inspectBtn = screen.getByTestId("inspect-toggle-btn");
    fireEvent.click(inspectBtn);

    // Drawer is now open
    const drawer = screen.getByTestId("inspection-drawer");
    expect(drawer).toBeDefined();
    expect(screen.getByText("HỒ SƠ PHÂN XỬ CHI TIẾT")).toBeDefined();

    // Check tabs
    expect(screen.getByText("Bằng chứng (G & Adv)")).toBeDefined();
    expect(screen.getByText("Quy tắc (R1–R6)")).toBeDefined();
    expect(screen.getByText("Repair & Gate (G1–G5)")).toBeDefined();

    // Switch to Rules tab
    fireEvent.click(screen.getByText("Quy tắc (R1–R6)"));
    expect(screen.getByText("Cây Quyết Định R1–R6 (RuleLadder)")).toBeDefined();

    // Switch to Gate tab
    fireEvent.click(screen.getByText("Repair & Gate (G1–G5)"));
    expect(screen.getByText("5 Chốt Kiểm Fail-Closed Gate (G1–G5)")).toBeDefined();
  });

  it("supports bottom chat composer to send messages and receive assistant responses", async () => {
    render(<ChatTestbed initialCaseId="case_spec_fault" />);

    // Bottom composer input exists
    const input = screen.getByTestId("chat-composer-input") as HTMLInputElement;
    const sendBtn = screen.getByTestId("chat-composer-send-btn") as HTMLButtonElement;
    expect(input).toBeDefined();
    expect(sendBtn.disabled).toBe(true);

    // Type a re-description question
    fireEvent.change(input, { target: { value: "Mô tả lại bài toán và phân tích lỗi" } });
    expect(sendBtn.disabled).toBe(false);

    // Submit message
    fireEvent.click(sendBtn);

    // User message should appear in chat
    expect(screen.getByText("Mô tả lại bài toán và phân tích lỗi")).toBeDefined();

    // Assistant response arrives with task description
    await waitFor(
      () => {
        expect(screen.getByText(/Mô Tả Tác Vụ:/)).toBeDefined();
      },
      { timeout: 2000 }
    );
  });

  it("toggles technical details view inside message stream", () => {
    render(<ChatTestbed initialCaseId="case_spec_fault" />);

    // Collapsible button exists
    const toggleBtn = screen.getByText(/Hiện chi tiết kỹ thuật/);
    expect(toggleBtn).toBeDefined();

    // Click to show details
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Ẩn chi tiết kỹ thuật/)).toBeDefined();
    expect(screen.getByText(/Mệnh đề kiểm tra:/)).toBeDefined();

    // Click to hide details
    fireEvent.click(screen.getByText(/Ẩn chi tiết kỹ thuật/));
    expect(screen.getByText(/Hiện chi tiết kỹ thuật/)).toBeDefined();
  });
});
