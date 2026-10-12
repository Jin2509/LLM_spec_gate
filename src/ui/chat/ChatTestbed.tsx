/**
 * src/ui/chat/ChatTestbed.tsx — LLM Interaction Testbed (ChatGPT/Claude Style)
 *
 * Requirements:
 *   - Conversational Chat Interface with bottom prompt composer (like ChatGPT / Claude).
 *   - Clean conversational flow: hides dense technical details by default, allowing natural
 *     interaction, task re-description ("mô tả lại"), execution triggers, and user answers.
 *   - In-stream responses: user messages appear on right, assistant answers on left.
 *   - In-stream Single-Shot Prompt Box for UNKNOWN cases that locks immediately ("SPENT") upon answering.
 *   - Left Sidebar: Dataset selection (HumanEval+, MBPP+, EvalPlus) & filterable case list.
 *   - Right Slide-over Inspector Drawer: Detailed formal checks (Evidence, R1–R6, Gate G1–G5).
 *   - Zero hardcoded HEX colors — strictly uses tokens.css variables.
 */
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { SAMPLE_CASES } from "@/mock/fixtures/sample-cases";
import { ACADEMIC_TASKS } from "@/mock/fixtures/academic-tasks";
import {
  VerdictChip,
  ProvenanceTag,
  RuleLadder,
  ValueCompare,
  GuaranteeBadge,
} from "@/ui/domain";
import { useTheme } from "@/features/theme/use-theme";
import { i18n } from "@/i18n/vi";
import type { CaseDossier, HumanQueryTicket, Verdict } from "@/core/types";

export interface ChatTestbedProps {
  initialCaseId?: string;
  runId?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  hasDetails?: boolean;
  isTicketPrompt?: boolean;
  isResolution?: boolean;
  verdict?: Verdict;
}

export function ChatTestbed({
  initialCaseId = "case_spec_fault",
  runId = "run_evalplus_01",
}: ChatTestbedProps) {
  const { theme, toggleTheme } = useTheme();

  // Dataset Selection
  const [selectedDataset, setSelectedDataset] = useState<string>("humaneval");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterVerdict, setFilterVerdict] = useState<string>("ALL");

  // Active Case Selection
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId);

  // Inspection Drawer Visibility (collapsed by default)
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [inspectorTab, setInspectorTab] = useState<"evidence" | "rules" | "gate">("evidence");

  // Toggle for technical details view inside stream
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  // Bottom Chat Composer Input State
  const [composerInput, setComposerInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Local Interactive Tickets State (Single-shot lock)
  const [ticketsState, setTicketsState] = useState<Record<string, HumanQueryTicket>>(() => {
    const init: Record<string, HumanQueryTicket> = {};
    for (const [id, c] of Object.entries(SAMPLE_CASES)) {
      if (c.ticket) {
        init[id] = { ...c.ticket };
      }
    }
    return init;
  });

  // Ticket input inside prompt box
  const [promptInputValue, setPromptInputValue] = useState<string>("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Active Case Data
  const activeCase: CaseDossier = SAMPLE_CASES[selectedCaseId] ?? SAMPLE_CASES.case_spec_fault!;
  const activeTicket: HumanQueryTicket | undefined = ticketsState[selectedCaseId];
  const activeTask = useMemo(() => {
    return (
      ACADEMIC_TASKS.find((t) => t.id === activeCase.taskId) ?? {
        id: activeCase.taskId,
        name: activeCase.taskId,
        intentDocstring: "Kiểm thử vận hành hàm mục tiêu với đặc tả giám sát song hành.",
        isUniqueOutput: true,
      }
    );
  }, [activeCase.taskId]);

  // Messages thread state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize or reset chat conversation whenever activeCase changes
  useEffect(() => {
    const isUnknown =
      activeCase.adjudication.verdict === "UNKNOWN_EVIDENCE" ||
      activeCase.adjudication.verdict === "UNKNOWN_CONFLICT";

    const initialMsgs: ChatMessage[] = [
      {
        id: `init_runner_${selectedCaseId}`,
        role: "user",
        text: `Kiểm thử tác vụ ${activeTask.name} (${activeCase.taskId}) với witness w = ${JSON.stringify(activeCase.witness)}.`,
        timestamp: new Date().toLocaleTimeString("vi-VN"),
      },
      {
        id: `init_resp_${selectedCaseId}`,
        role: "assistant",
        text: `Đã thực thi kiểm thử cho hàm **${activeTask.name}** tại witness: \`w = ${JSON.stringify(
          activeCase.witness
        )}\`.\n\n• **Đầu ra thực tế (c):** \`${JSON.stringify(activeCase.codeOutput)}\`\n• **Đặc tả P_0:** ${
          activeCase.monitorRejectionClause
            ? `BÁC BỎ (Vi phạm mệnh đề: \`${activeCase.monitorRejectionClause}\`)`
            : "CHẤP NHẬN"
        }\n• **Phán xử:** **${activeCase.adjudication.verdict}** (${activeCase.adjudication.matchedRule})\n\n${
          activeCase.adjudication.explanation
        }`,
        timestamp: new Date().toLocaleTimeString("vi-VN"),
        hasDetails: true,
        isTicketPrompt: isUnknown,
        verdict: activeCase.adjudication.verdict,
      },
    ];

    setMessages(initialMsgs);
    setShowTechnicalDetails(false);
  }, [selectedCaseId, activeCase, activeTask]);

  // Available Cases list formatted for sidebar
  const caseList = useMemo(() => {
    return Object.entries(SAMPLE_CASES).map(([id, c]) => {
      const task = ACADEMIC_TASKS.find((t) => t.id === c.taskId);
      return {
        id,
        taskId: c.taskId,
        taskName: task ? task.name : c.taskId,
        intent: task?.intentDocstring ?? "",
        verdict: c.adjudication.verdict,
        witnessStr: JSON.stringify(c.witness),
        ticket: ticketsState[id] ?? c.ticket,
      };
    });
  }, [ticketsState]);

  // Filtered cases for sidebar search/filter
  const filteredCases = useMemo(() => {
    return caseList.filter((item) => {
      const matchesQuery =
        item.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.taskId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesQuery) return false;

      if (filterVerdict === "UNKNOWN") {
        return (
          item.verdict === "UNKNOWN_EVIDENCE" ||
          item.verdict === "UNKNOWN_CONFLICT" ||
          item.verdict === "UNKNOWN_GATE"
        );
      }
      if (filterVerdict === "FAULTS") {
        return (
          item.verdict === "SPEC_FAULT" ||
          item.verdict === "CODE_FAULT" ||
          item.verdict === "DUAL_FAULT"
        );
      }
      if (filterVerdict === "ACC") {
        return item.verdict === "ACC";
      }
      return true;
    });
  }, [caseList, searchQuery, filterVerdict]);

  // Handle single-shot human query answer
  const handleAnswerTicket = async (answerVal: unknown) => {
    if (!activeTicket || activeTicket.status === "spent") return;

    try {
      setIsSubmittingAnswer(true);
      setSubmissionError(null);

      // Attempt to hit mock API
      try {
        await fetch(`/api/tickets/${activeTicket.id}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: answerVal, durationMs: 1200 }),
        });
      } catch {
        // Fallback gracefully in offline mock test mode
      }

      // Immediately lock and stamp the ticket (pessimistic / single-shot)
      setTicketsState((prev) => ({
        ...prev,
        [selectedCaseId]: {
          ...activeTicket,
          status: "spent",
          answer: answerVal,
          answeredAt: new Date().toLocaleTimeString("vi-VN"),
        },
      }));
      setPromptInputValue("");

      // Append assistant resolution message
      const resolutionVerdict: Verdict =
        activeCase.adjudication.verdict === "UNKNOWN_EVIDENCE" ? "ACC" : "SPEC_FAULT";

      const answerLabel =
        typeof answerVal === "boolean"
          ? answerVal
            ? "Chấp nhận"
            : "Không chấp nhận"
          : JSON.stringify(answerVal);

      setMessages((prev) => [
        ...prev,
        {
          id: `res_${Date.now()}`,
          role: "assistant",
          text: `✓ **Đã ghi nhận phản hồi:** \`${answerLabel}\`.\n\nCâu trả lời đã được đưa vào tập chứng cứ Grounded ($G$). Vé hỏi tương tác người đã chính thức khóa vĩnh viễn (Single-Shot Invariant).\n\n• **Phán xử cập nhật:** **${resolutionVerdict}**\n• **Quy tắc phân xử:** R2 / R4. Chu trình phân xử đã khép lại an toàn.`,
          timestamp: new Date().toLocaleTimeString("vi-VN"),
          isResolution: true,
          verdict: resolutionVerdict,
        },
      ]);
    } catch (err: unknown) {
      setSubmissionError(err instanceof Error ? err.message : i18n.ticket.alreadySpentError);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleUncertain = async () => {
    if (!activeTicket || activeTicket.status === "spent") return;
    try {
      setIsSubmittingAnswer(true);
      setTicketsState((prev) => ({
        ...prev,
        [selectedCaseId]: {
          ...activeTicket,
          status: "spent",
          isUncertain: true,
          answeredAt: new Date().toLocaleTimeString("vi-VN"),
        },
      }));

      setMessages((prev) => [
        ...prev,
        {
          id: `uncert_${Date.now()}`,
          role: "assistant",
          text: `Bạn đã đánh dấu **Không xác định được (UNCERTAIN)**. Vé hỏi đã khóa vĩnh viễn. Trạng thái vụ việc được giữ nguyên là **UNKNOWN_EVIDENCE** theo nguyên tắc Fail-Closed (không đoán mò).`,
          timestamp: new Date().toLocaleTimeString("vi-VN"),
          isResolution: true,
          verdict: "UNKNOWN_EVIDENCE",
        },
      ]);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // Handle message submission from bottom chat composer
  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend ?? composerInput).trim();
    if (!text) return;

    setComposerInput("");
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString("vi-VN"),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Process user query and generate response
    setTimeout(() => {
      setIsTyping(false);
      const lower = text.toLowerCase();

      // Case 1: Re-description request ("mô tả lại", "giải thích", "chi tiết")
      if (
        lower.includes("mô tả") ||
        lower.includes("giải thích") ||
        lower.includes("yêu cầu") ||
        lower.includes("đặc tả")
      ) {
        setMessages((prev) => [
          ...prev,
          {
            id: `asst_${Date.now()}`,
            role: "assistant",
            text: `### Mô Tả Tác Vụ: ${activeTask.name} (${activeCase.taskId})\n\n**Mục tiêu bài toán:**\n${
              activeTask.intentDocstring
            }\n\n**Hành vi kiểm thử:**\n- **Đầu vào witness (w):** \`${JSON.stringify(
              activeCase.witness
            )}\`\n- **Đầu ra thực tế của code (c):** \`${JSON.stringify(
              activeCase.codeOutput
            )}\`\n- **Đặc tả P_0 kiểm tra:** \`${
              activeCase.monitorRejectionClause ?? "Mặc định"
            }\`\n\n**Phân tích nguyên nhân:**\n${
              activeCase.adjudication.explanation
            }`,
            timestamp: new Date().toLocaleTimeString("vi-VN"),
            hasDetails: true,
            verdict: activeCase.adjudication.verdict,
          },
        ]);
        return;
      }

      // Case 2: Run test request ("kiểm thử", "chạy lại", "test")
      if (lower.includes("kiểm thử") || lower.includes("chạy lại") || lower.includes("test")) {
        setMessages((prev) => [
          ...prev,
          {
            id: `asst_${Date.now()}`,
            role: "assistant",
            text: `🔄 **Đã chạy lại kiểm thử:**\n\n• **Kết quả đầu ra:** \`c = ${JSON.stringify(
              activeCase.codeOutput
            )}\`\n• **Giám sát đặc tả P_0:** ${
              activeCase.monitorRejectionClause ? "BÁC BỎ" : "CHẤP NHẬN"
            }\n• **Phán xử:** **${activeCase.adjudication.verdict}** (${
              activeCase.adjudication.matchedRule
            })\n\n${activeCase.adjudication.explanation}`,
            timestamp: new Date().toLocaleTimeString("vi-VN"),
            hasDetails: true,
            verdict: activeCase.adjudication.verdict,
          },
        ]);
        return;
      }

      // Case 3: Ticket answering via chat ("chấp nhận", "không chấp nhận", "accept", "reject")
      if (activeTicket && activeTicket.status !== "spent") {
        if (lower === "chấp nhận" || lower === "có" || lower === "accept" || lower === "yes" || lower === "1") {
          handleAnswerTicket(true);
          return;
        }
        if (
          lower === "không chấp nhận" ||
          lower === "không" ||
          lower === "reject" ||
          lower === "no" ||
          lower === "2"
        ) {
          handleAnswerTicket(false);
          return;
        }
        if (lower.includes("không chắc") || lower.includes("uncertain") || lower === "c") {
          handleUncertain();
          return;
        }

        // Value submission for unique output ticket
        try {
          const parsed = JSON.parse(text);
          handleAnswerTicket(parsed);
          return;
        } catch {
          if (/^-?\d+(\.\d+)?$/.test(text)) {
            handleAnswerTicket(Number(text));
            return;
          }
        }
      }

      // Default General Response
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_${Date.now()}`,
          role: "assistant",
          text: `Tôi đã nhận yêu cầu của bạn: "${text}".\n\n• **Tác vụ hiện tại:** \`${activeTask.name}\`\n• **Phán xử hiện thời:** **${
            activeCase.adjudication.verdict
          }**\n\nBạn có thể bấm nút **"Xem chi tiết phân xử (Inspect)"** ở góc trên bên phải để kiểm tra sâu các chốt kiểm G1–G5, chứng cứ Grounded và cây quyết định R1–R6.`,
          timestamp: new Date().toLocaleTimeString("vi-VN"),
        },
      ]);
    }, 400);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        background: "var(--paper-ground)",
        color: "var(--ink)",
        fontFamily: "var(--font-ui)",
        overflow: "hidden",
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. LEFT SIDEBAR: Dataset & Test Case Selection
         ───────────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: "300px",
          minWidth: "260px",
          maxWidth: "340px",
          height: "100%",
          background: "var(--paper-surface)",
          borderRight: "1px solid var(--rule)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        {/* Sidebar Header & Brand */}
        <div
          style={{
            padding: "var(--s-4)",
            borderBottom: "1px solid var(--rule)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                }}
              >
                Dual-Oracle Testbed
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  padding: "1px 5px",
                  borderRadius: "var(--r-cell)",
                  background: "var(--paper-ground)",
                  border: "1px solid var(--rule)",
                  color: "var(--ink-soft)",
                }}
              >
                v1.4
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--ink-soft)", marginTop: "2px" }}>
              Run: {runId}
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? i18n.theme.toggleLight : i18n.theme.toggleDark}
            style={{
              padding: "4px 8px",
              borderRadius: "var(--r-cell)",
              border: "1px solid var(--rule)",
              background: "var(--paper-ground)",
              color: "var(--ink)",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
            }}
          >
            {theme === "dark" ? "☀ Sáng" : "◑ Tối"}
          </button>
        </div>

        {/* Dataset Dropdown */}
        <div style={{ padding: "var(--s-3) var(--s-4)", borderBottom: "1px solid var(--rule)" }}>
          <label
            htmlFor="dataset-select"
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--ink-soft)",
              marginBottom: "var(--s-1)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Dataset
          </label>
          <select
            id="dataset-select"
            value={selectedDataset}
            onChange={(e) => setSelectedDataset(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 10px",
              borderRadius: "var(--r-cell)",
              border: "1px solid var(--rule)",
              background: "var(--paper-ground)",
              color: "var(--ink)",
              fontSize: "12px",
              fontFamily: "var(--font-ui)",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="humaneval">HumanEval+ (EvalPlus v0.2)</option>
            <option value="mbpp">MBPP+ (Sanitized)</option>
            <option value="evalplus_demo">EvalPlus Illustrative</option>
          </select>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ padding: "var(--s-3) var(--s-4)", borderBottom: "1px solid var(--rule)" }}>
          <input
            type="text"
            placeholder="Tìm tác vụ, witness, hoặc ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 10px",
              borderRadius: "var(--r-cell)",
              border: "1px solid var(--rule)",
              background: "var(--paper-ground)",
              color: "var(--ink)",
              fontSize: "12px",
              fontFamily: "var(--font-ui)",
              outline: "none",
              marginBottom: "var(--s-2)",
            }}
          />

          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "UNKNOWN", label: "Cần hỏi (UND)" },
              { id: "FAULTS", label: "Lỗi (Faults)" },
              { id: "ACC", label: "Đạt (ACC)" },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilterVerdict(pill.id)}
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  padding: "2px 8px",
                  borderRadius: "var(--r-cell)",
                  border: filterVerdict === pill.id ? "1px solid var(--action)" : "1px solid var(--rule)",
                  background: filterVerdict === pill.id ? "var(--paper-ground)" : "transparent",
                  color: filterVerdict === pill.id ? "var(--action)" : "var(--ink-soft)",
                  fontWeight: filterVerdict === pill.id ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Task / Test Case List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--s-2) var(--s-3)" }}>
          {filteredCases.map((item) => {
            const isSelected = item.id === selectedCaseId;
            const isSpent = item.ticket?.status === "spent";

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedCaseId(item.id);
                  setPromptInputValue("");
                  setSubmissionError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedCaseId(item.id);
                  }
                }}
                data-testid={`case-item-${item.id}`}
                style={{
                  padding: "var(--s-3)",
                  borderRadius: "var(--r-card)",
                  marginBottom: "var(--s-2)",
                  border: isSelected ? "1.5px solid var(--action)" : "1px solid var(--rule)",
                  background: isSelected ? "var(--paper-ground)" : "transparent",
                  cursor: "pointer",
                  transition: "background var(--motion-quick) ease, border-color var(--motion-quick) ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: isSelected ? "var(--action)" : "var(--ink)",
                    }}
                  >
                    {item.taskName}
                  </span>
                  <VerdictChip verdict={item.verdict} size="sm" />
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--ink-soft)",
                    marginBottom: "4px",
                  }}
                >
                  w: {item.witnessStr}
                </div>

                {item.ticket && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                    <span
                      style={{
                        fontSize: "9px",
                        fontFamily: "var(--font-mono)",
                        padding: "1px 5px",
                        borderRadius: "var(--r-cell)",
                        border: isSpent ? "1px solid var(--v-code)" : "1px dashed var(--action)",
                        color: isSpent ? "var(--v-code)" : "var(--action)",
                        fontWeight: 600,
                      }}
                    >
                      {isSpent ? "Đã phản hồi (SPENT)" : "Cần hỏi người"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. CENTRAL CONVERSATIONAL FEED STREAM (LLM Style)
         ───────────────────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "var(--paper-ground)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Stream Top Header */}
        <header
          style={{
            padding: "var(--s-3) var(--s-6)",
            background: "var(--paper-surface)",
            borderBottom: "1px solid var(--rule)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-soft)" }}>
                {activeCase.taskId}
              </span>
              <span style={{ color: "var(--rule)" }}>·</span>
              <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>
                {activeTask.name}
              </h2>
            </div>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "12px",
                color: "var(--ink-soft)",
                maxWidth: "600px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {activeTask.intentDocstring}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
            <button
              type="button"
              onClick={() => handleSendMessage("Kiểm thử lại tác vụ này")}
              data-testid="rerun-btn"
              style={{
                padding: "6px 12px",
                borderRadius: "var(--r-cell)",
                border: "1px solid var(--rule)",
                background: "var(--paper-ground)",
                color: "var(--ink)",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ↺ Chạy lại kiểm thử
            </button>

            <button
              type="button"
              onClick={() => setIsInspectorOpen((prev) => !prev)}
              data-testid="inspect-toggle-btn"
              style={{
                padding: "6px 14px",
                borderRadius: "var(--r-cell)",
                border: isInspectorOpen ? "1.5px solid var(--action)" : "1px solid var(--rule)",
                background: isInspectorOpen ? "var(--paper-ground)" : "var(--paper-surface)",
                color: isInspectorOpen ? "var(--action)" : "var(--ink)",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🔍</span>
              <span>{isInspectorOpen ? "Đóng Inspector" : "Xem chi tiết phân xử (Inspect)"}</span>
            </button>
          </div>
        </header>

        {/* Message Stream Scrollable Area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "var(--s-6)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ width: "100%", maxWidth: "760px", display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>
            {messages.map((msg) => {
              const isUser = msg.role === "user";

              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isUser ? "flex-end" : "flex-start",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--s-2)",
                      fontSize: "11px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--ink-soft)",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: isUser ? "var(--ink)" : "var(--action)" }}>
                      {isUser ? "Kiểm Thử Viên (Testbed Runner)" : "Giám Sát Song Hành (Dual-Oracle Monitor)"}
                    </span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    style={{
                      maxWidth: "90%",
                      background: isUser ? "var(--paper-surface)" : "var(--paper-surface)",
                      border: isUser ? "1px solid var(--rule)" : "1px solid var(--rule)",
                      borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                      padding: "var(--s-4)",
                      fontSize: "13px",
                      lineHeight: 1.6,
                      color: "var(--ink)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    }}
                  >
                    {/* Render message text with basic formatting */}
                    <div style={{ whiteSpace: "pre-line" }}>{msg.text}</div>

                    {/* Verdict Chip announcement if present */}
                    {msg.verdict && (
                      <div style={{ marginTop: "var(--s-3)", display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                        <VerdictChip verdict={msg.verdict} showFullLabel />
                        <button
                          type="button"
                          onClick={() => setIsInspectorOpen(true)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--action)",
                            fontSize: "11px",
                            fontFamily: "var(--font-mono)",
                            cursor: "pointer",
                            padding: 0,
                            textDecoration: "underline",
                            marginLeft: "var(--s-2)",
                          }}
                        >
                          Xem bằng chứng & luật áp dụng →
                        </button>
                      </div>
                    )}

                    {/* Collapsible Technical Details (Hidden by default to keep chat clean) */}
                    {msg.hasDetails && (
                      <div style={{ marginTop: "var(--s-3)", borderTop: "1px solid var(--rule)", paddingTop: "var(--s-2)" }}>
                        <button
                          type="button"
                          onClick={() => setShowTechnicalDetails((v) => !v)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--ink-soft)",
                            fontSize: "11px",
                            fontFamily: "var(--font-mono)",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span>{showTechnicalDetails ? "▲ Ẩn chi tiết kỹ thuật" : "▼ Hiện chi tiết kỹ thuật (Witness & Spec)"}</span>
                        </button>

                        {showTechnicalDetails && (
                          <div
                            style={{
                              marginTop: "var(--s-2)",
                              padding: "var(--s-3)",
                              background: "var(--paper-ground)",
                              borderRadius: "var(--r-cell)",
                              border: "1px solid var(--rule)",
                              fontSize: "11px",
                              fontFamily: "var(--font-mono)",
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                          >
                            <div>
                              <strong>Witness w:</strong> <code>{JSON.stringify(activeCase.witness)}</code>
                            </div>
                            <div>
                              <strong>Code output c:</strong> <code>{JSON.stringify(activeCase.codeOutput)}</code>
                            </div>
                            <div>
                              <strong>Mệnh đề kiểm tra:</strong> <code>{activeCase.monitorRejectionClause ?? "Mặc định"}</code>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* In-stream Prompt Box for UNKNOWN case (Single-Shot) */}
                    {msg.isTicketPrompt && activeTicket && (
                      <div
                        data-testid="chat-prompt-box"
                        style={{
                          position: "relative",
                          marginTop: "var(--s-4)",
                          padding: "var(--s-4)",
                          background: "var(--paper-ground)",
                          borderRadius: "var(--r-card)",
                          border: activeTicket.status === "spent" ? "1px solid var(--rule)" : "1.5px solid var(--action)",
                        }}
                      >
                        {/* Spent Stamp */}
                        {activeTicket.status === "spent" && (
                          <div
                            data-testid="chat-spent-stamp"
                            style={{
                              position: "absolute",
                              top: "12px",
                              right: "12px",
                              transform: "rotate(-6deg)",
                              padding: "3px 10px",
                              borderRadius: "var(--r-cell)",
                              border: "2px dashed var(--v-code)",
                              color: "var(--v-code)",
                              background: "var(--v-code-bg)",
                              fontFamily: "var(--font-mono)",
                              fontWeight: 800,
                              fontSize: "11px",
                              letterSpacing: "0.05em",
                              pointerEvents: "none",
                            }}
                          >
                            {i18n.ticket.spentStamp}
                          </div>
                        )}

                        <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--action)", fontWeight: 700, textTransform: "uppercase" }}>
                          {i18n.ticket.title} · ĐÚNG 1 LẦN
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", margin: "4px 0 var(--s-3)" }}>
                          {activeTicket.promptText}
                        </div>

                        {activeTicket.status === "spent" ? (
                          <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--ink)" }}>
                            <strong>Phản hồi đã lưu:</strong>{" "}
                            {activeTicket.isUncertain
                              ? "Không xác định được (UNCERTAIN)"
                              : typeof activeTicket.answer === "boolean"
                                ? activeTicket.answer
                                  ? "Chấp nhận (ACCEPT)"
                                  : "Không chấp nhận (REJECT)"
                                : JSON.stringify(activeTicket.answer)}
                            <div style={{ fontSize: "10px", color: "var(--ink-soft)", marginTop: "2px" }}>
                              Trạng thái: Đã khóa vĩnh viễn (Single-Shot Invariant).
                            </div>
                          </div>
                        ) : (
                          <div>
                            {activeTicket.questionType === "acceptability" ? (
                              <div style={{ display: "flex", gap: "var(--s-2)", flexWrap: "wrap" }}>
                                <button
                                  type="button"
                                  disabled={isSubmittingAnswer}
                                  onClick={() => handleAnswerTicket(true)}
                                  data-testid="chat-ticket-accept-btn"
                                  style={{
                                    padding: "6px 14px",
                                    borderRadius: "var(--r-cell)",
                                    border: "1px solid var(--v-acc)",
                                    background: "var(--v-acc-bg)",
                                    color: "var(--v-acc)",
                                    fontSize: "12px",
                                    fontFamily: "var(--font-mono)",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  ✓ [1] Chấp nhận
                                </button>
                                <button
                                  type="button"
                                  disabled={isSubmittingAnswer}
                                  onClick={() => handleAnswerTicket(false)}
                                  data-testid="chat-ticket-reject-btn"
                                  style={{
                                    padding: "6px 14px",
                                    borderRadius: "var(--r-cell)",
                                    border: "1px solid var(--v-code)",
                                    background: "var(--v-code-bg)",
                                    color: "var(--v-code)",
                                    fontSize: "12px",
                                    fontFamily: "var(--font-mono)",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  ✕ [2] Không chấp nhận
                                </button>
                                <button
                                  type="button"
                                  disabled={isSubmittingAnswer}
                                  onClick={handleUncertain}
                                  data-testid="chat-ticket-uncertain-btn"
                                  style={{
                                    padding: "6px 12px",
                                    borderRadius: "var(--r-cell)",
                                    border: "1px dashed var(--rule)",
                                    background: "transparent",
                                    color: "var(--ink-soft)",
                                    fontSize: "12px",
                                    fontFamily: "var(--font-mono)",
                                    cursor: "pointer",
                                  }}
                                >
                                  ? [C] Không xác định
                                </button>
                              </div>
                            ) : (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  if (!promptInputValue.trim()) return;
                                  handleAnswerTicket(promptInputValue);
                                }}
                              >
                                <div style={{ display: "flex", gap: "var(--s-2)" }}>
                                  <input
                                    type="text"
                                    value={promptInputValue}
                                    onChange={(e) => setPromptInputValue(e.target.value)}
                                    placeholder='Nhập giá trị mong muốn e(w), ví dụ: 42 hoặc [1, 2]'
                                    disabled={isSubmittingAnswer}
                                    style={{
                                      flex: 1,
                                      padding: "6px 10px",
                                      borderRadius: "var(--r-cell)",
                                      border: "1px solid var(--rule)",
                                      background: "var(--paper-surface)",
                                      color: "var(--ink)",
                                      fontSize: "12px",
                                      fontFamily: "var(--font-mono)",
                                      outline: "none",
                                    }}
                                  />
                                  <button
                                    type="submit"
                                    disabled={isSubmittingAnswer || !promptInputValue.trim()}
                                    style={{
                                      padding: "6px 14px",
                                      borderRadius: "var(--r-cell)",
                                      border: "none",
                                      background: "var(--action)",
                                      color: "var(--paper-surface)",
                                      fontSize: "12px",
                                      fontFamily: "var(--font-mono)",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Gửi câu trả lời
                                  </button>
                                </div>
                              </form>
                            )}

                            {submissionError && (
                              <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--v-code)", fontFamily: "var(--font-mono)" }}>
                                {submissionError}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Assistant typing indicator */}
            {isTyping && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--ink-soft)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                <span>Dual-Oracle đang xử lý</span>
                <span className="animate-pulse">● ● ●</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            BOTTOM CHAT COMPOSER (Like ChatGPT / Claude)
           ───────────────────────────────────────────────────────────── */}
        <div
          style={{
            padding: "var(--s-3) var(--s-6) var(--s-4)",
            background: "var(--paper-surface)",
            borderTop: "1px solid var(--rule)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ width: "100%", maxWidth: "760px" }}>
            {/* Quick Action Suggestion Chips */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "var(--s-2)", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => handleSendMessage("Mô tả lại bài toán và phân tích lỗi")}
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  padding: "3px 10px",
                  borderRadius: "var(--r-cell)",
                  border: "1px solid var(--rule)",
                  background: "var(--paper-ground)",
                  color: "var(--ink)",
                  cursor: "pointer",
                }}
              >
                📝 Mô tả lại bài toán & lỗi
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage("Kiểm thử lại tác vụ với witness w")}
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  padding: "3px 10px",
                  borderRadius: "var(--r-cell)",
                  border: "1px solid var(--rule)",
                  background: "var(--paper-ground)",
                  color: "var(--ink)",
                  cursor: "pointer",
                }}
              >
                ▶ Kiểm thử witness w
              </button>

              <button
                type="button"
                onClick={() => setIsInspectorOpen(true)}
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  padding: "3px 10px",
                  borderRadius: "var(--r-cell)",
                  border: "1px solid var(--rule)",
                  background: "var(--paper-ground)",
                  color: "var(--action)",
                  cursor: "pointer",
                }}
              >
                🔍 Mở Bảng phân tích chi tiết
              </button>
            </div>

            {/* Floating Chat Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                background: "var(--paper-ground)",
                borderRadius: "var(--r-ticket)",
                border: "1.5px solid var(--rule)",
                padding: "6px 12px",
                transition: "border-color var(--motion-quick) ease",
              }}
            >
              <input
                type="text"
                data-testid="chat-composer-input"
                value={composerInput}
                onChange={(e) => setComposerInput(e.target.value)}
                placeholder='Nhập câu hỏi, yêu cầu "Mô tả lại", hoặc nhập phản hồi kiểm thử...'
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "var(--ink)",
                  fontSize: "13px",
                  fontFamily: "var(--font-ui)",
                  padding: "6px 8px",
                }}
              />

              <button
                type="submit"
                data-testid="chat-composer-send-btn"
                disabled={!composerInput.trim()}
                aria-label="Gửi tin nhắn"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "none",
                  background: composerInput.trim() ? "var(--action)" : "var(--paper-surface)",
                  color: composerInput.trim() ? "var(--paper-surface)" : "var(--ink-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: composerInput.trim() ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  fontWeight: 700,
                  transition: "background var(--motion-quick) ease",
                }}
              >
                ↑
              </button>
            </form>

            <div
              style={{
                marginTop: "6px",
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                color: "var(--ink-soft)",
                textAlign: "center",
              }}
            >
              Dual-Oracle Monitoring v1.4 · Fail-Closed Invariant · Single-Shot Human Query Protected
            </div>
          </div>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. INSPECTION PANEL (Drawer / Slide-over — Collapsed by default)
         ───────────────────────────────────────────────────────────── */}
      {isInspectorOpen && (
        <aside
          data-testid="inspection-drawer"
          style={{
            width: "420px",
            height: "100%",
            background: "var(--paper-surface)",
            borderLeft: "1px solid var(--rule)",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            zIndex: 40,
            boxShadow: "-4px 0 20px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Drawer Header */}
          <div
            style={{
              padding: "var(--s-4)",
              borderBottom: "1px solid var(--rule)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--action)", fontWeight: 600 }}>
                HỒ SƠ PHÂN XỬ CHI TIẾT
              </div>
              <h3 style={{ margin: "2px 0 0", fontSize: "15px", fontWeight: 700 }}>
                {activeCase.id}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsInspectorOpen(false)}
              aria-label="Đóng Drawer"
              style={{
                background: "transparent",
                border: "1px solid var(--rule)",
                borderRadius: "var(--r-cell)",
                padding: "4px 8px",
                color: "var(--ink-soft)",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          {/* Drawer Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--rule)",
              background: "var(--paper-ground)",
            }}
          >
            {[
              { id: "evidence", label: "Bằng chứng (G & Adv)" },
              { id: "rules", label: "Quy tắc (R1–R6)" },
              { id: "gate", label: "Repair & Gate (G1–G5)" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInspectorTab(tab.id as "evidence" | "rules" | "gate")}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: inspectorTab === tab.id ? 700 : 500,
                  color: inspectorTab === tab.id ? "var(--action)" : "var(--ink-soft)",
                  background: inspectorTab === tab.id ? "var(--paper-surface)" : "transparent",
                  border: "none",
                  borderBottom: inspectorTab === tab.id ? "2px solid var(--action)" : "2px solid transparent",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Drawer Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "var(--s-4)", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
            {/* ── TAB 1: Evidence ── */}
            {inspectorTab === "evidence" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
                <div>
                  <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {i18n.evidence.grounded} ({activeCase.groundedEvidence.length})
                  </h4>
                  {activeCase.groundedEvidence.length === 0 ? (
                    <div style={{ fontSize: "12px", color: "var(--ink-soft)", fontStyle: "italic" }}>
                      Không có bằng chứng grounded tại witness này.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                      {activeCase.groundedEvidence.map((ev) => (
                        <div
                          key={ev.id}
                          style={{
                            padding: "var(--s-3)",
                            borderRadius: "var(--r-cell)",
                            border: "1px solid var(--rule)",
                            background: "var(--paper-ground)",
                          }}
                        >
                          <ProvenanceTag isGrounded={true} source={ev.source} />
                          <div style={{ marginTop: "6px", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                            {ev.kind === "expected_output" ? `e(w) = ${JSON.stringify(ev.expected)}` : `φ: ${ev.description}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {activeCase.advisoryEvidence.length > 0 && (
                  <div>
                    <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {i18n.evidence.advisory} ({activeCase.advisoryEvidence.length})
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                      {activeCase.advisoryEvidence.map((ev) => (
                        <div
                          key={ev.id}
                          style={{
                            padding: "var(--s-3)",
                            borderRadius: "var(--r-cell)",
                            border: "1px dashed var(--rule)",
                            background: "transparent",
                          }}
                        >
                          <ProvenanceTag isGrounded={false} source={ev.source} />
                          <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--ink-soft)" }}>
                            {String(ev.content)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: Rules R1–R6 ── */}
            {inspectorTab === "rules" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
                <div>
                  <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Cây Quyết Định R1–R6 (RuleLadder)
                  </h4>
                  <RuleLadder
                    matchedRule={activeCase.adjudication.matchedRule}
                    skippedRules={activeCase.adjudication.skippedRules}
                  />
                </div>

                <div>
                  <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    So Sánh Giá Trị (ValueCompare ≃)
                  </h4>
                  <ValueCompare
                    expected={activeCase.adjudication.expectedOutput ?? "Chưa xác định"}
                    actual={activeCase.codeOutput}
                    isUniqueOutput={true}
                  />
                </div>
              </div>
            )}

            {/* ── TAB 3: Repair & Gate ── */}
            {inspectorTab === "gate" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s-2)" }}>
                    <h4 style={{ margin: 0, fontSize: "12px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Ứng Viên Bản Vá (Repair Candidate)
                    </h4>
                    {activeCase.gateResult && (
                      <GuaranteeBadge
                        id="S1"
                        nature={activeCase.gateResult.guaranteeNature}
                        claimLabel="Gate"
                      />
                    )}
                  </div>

                  {activeCase.repairCandidate ? (
                    <div
                      style={{
                        padding: "var(--s-3)",
                        borderRadius: "var(--r-cell)",
                        border: "1px solid var(--rule)",
                        background: "var(--paper-ground)",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: "var(--ink-soft)" }}>
                        Họ luật: <strong>{activeCase.repairCandidate.family}</strong> · Rank #{activeCase.repairCandidate.rank}
                      </div>
                      <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", marginTop: "4px", color: "var(--ink)" }}>
                        Vùng g: <code>{activeCase.repairCandidate.guard}</code>
                      </div>
                      <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", marginTop: "2px", color: "var(--v-acc)" }}>
                        Bản sửa C&apos;: <code>{activeCase.repairCandidate.replacement}</code>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: "12px", color: "var(--ink-soft)", fontStyle: "italic" }}>
                      Không có bản vá cho trường hợp này.
                    </div>
                  )}
                </div>

                {activeCase.gateResult && (
                  <div>
                    <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      5 Chốt Kiểm Fail-Closed Gate (G1–G5)
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
                      <div style={{ color: activeCase.gateResult.checks.g1_accept_grounded ? "var(--v-acc)" : "var(--v-code)" }}>
                        {activeCase.gateResult.checks.g1_accept_grounded ? "✓" : "✗"} G1: Chấp nhận Grounded (e ∈ G)
                      </div>
                      <div style={{ color: activeCase.gateResult.checks.g2_reject_b ? "var(--v-acc)" : "var(--v-code)" }}>
                        {activeCase.gateResult.checks.g2_reject_b ? "✓" : "✗"} G2: Bác bỏ Counterexamples (b ∉ B)
                      </div>
                      <div style={{ color: activeCase.gateResult.checks.g3_locality ? "var(--v-acc)" : "var(--v-code)" }}>
                        {activeCase.gateResult.checks.g3_locality ? "✓" : "✗"} G3: Tính cục bộ (Locality)
                      </div>
                      <div style={{ color: activeCase.gateResult.checks.g4_preserve_g_a2 ? "var(--v-acc)" : "var(--v-code)" }}>
                        {activeCase.gateResult.checks.g4_preserve_g_a2 ? "✓" : "✗"} G4: Bảo toàn thuộc tính (A2)
                      </div>
                      <div style={{ color: activeCase.gateResult.checks.g5_in_repair_space_and_bsynth ? "var(--v-acc)" : "var(--v-code)" }}>
                        {activeCase.gateResult.checks.g5_in_repair_space_and_bsynth ? "✓" : "✗"} G5: Trong không gian sửa đổi
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
