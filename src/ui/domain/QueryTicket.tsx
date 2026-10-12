/**
 * src/ui/domain/QueryTicket.tsx — Single-Shot Human Query Ticket Component
 *
 * Requirements:
 *   - Monotonic lifecycle: unused -> open -> spent.
 *   - Once spent, displays prominent "ĐÃ SỬ DỤNG (SPENT)" stamp.
 *   - Submitting twice is rejected (409).
 *   - "Không xác định được" button has equal visual weight to "Gửi câu trả lời".
 *   - Zero hardcoded HEX colors.
 */
"use client";

import React, { useState } from "react";
import type { HumanQueryTicket } from "@/core/types";
import { i18n } from "@/i18n/vi";

export interface QueryTicketProps {
  ticket: HumanQueryTicket;
  onAnswer: (answer: unknown) => Promise<void>;
  onUncertain: () => Promise<void>;
  onDefer?: () => Promise<void>;
}

export function QueryTicket({
  ticket,
  onAnswer,
  onUncertain,
  onDefer,
}: QueryTicketProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSpent = ticket.status === "spent";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSpent || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onAnswer(inputValue);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : i18n.ticket.alreadySpentError;
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUncertain = async () => {
    if (isSpent || isSubmitting) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onUncertain();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : i18n.ticket.alreadySpentError;
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="region"
      aria-label={i18n.ticket.title}
      data-testid="query-ticket"
      data-status={ticket.status}
      style={{
        position: "relative",
        borderRadius: "var(--r-ticket)",
        border: "1.5px solid var(--rule)",
        background: "var(--paper-surface)",
        padding: "var(--s-4)",
        fontFamily: "var(--font-ui)",
        maxWidth: "460px",
        overflow: "hidden",
      }}
    >
      {/* ── Spent Stamp Overlay ── */}
      {isSpent && (
        <div
          data-testid="spent-stamp"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            transform: "rotate(-8deg)",
            padding: "4px 12px",
            borderRadius: "var(--r-cell)",
            border: "2px dashed var(--v-code)",
            color: "var(--v-code)",
            fontFamily: "var(--font-mono)",
            fontWeight: 800,
            fontSize: "12px",
            letterSpacing: "0.08em",
            pointerEvents: "none",
            background: "var(--v-code-bg)",
          }}
        >
          {i18n.ticket.spentStamp}
        </div>
      )}

      <div style={{ marginBottom: "var(--s-2)" }}>
        <span
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--action)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {i18n.ticket.title} · {ticket.id}
        </span>
        <h3
          style={{
            margin: "4px 0 0",
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          {ticket.promptText}
        </h3>
      </div>

      {ticket.questionType === "expected-output" ? (
        <form onSubmit={handleSubmit} style={{ marginTop: "var(--s-3)" }}>
          <label
            htmlFor={`ticket-input-${ticket.id}`}
            style={{
              display: "block",
              fontSize: "12px",
              color: "var(--ink-soft)",
              marginBottom: "4px",
            }}
          >
            Nhập giá trị e(w) mong đợi:
          </label>
          <input
            id={`ticket-input-${ticket.id}`}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isSpent || isSubmitting}
            placeholder="Ví dụ: 42 hoặc [1, 2, 3]"
            style={{
              width: "100%",
              padding: "var(--s-2)",
              borderRadius: "var(--r-cell)",
              border: "1px solid var(--rule)",
              background: "var(--paper-ground)",
              color: "var(--ink)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              boxSizing: "border-box",
              marginBottom: "var(--s-3)",
            }}
          />

          <div style={{ display: "flex", gap: "var(--s-2)" }}>
            <button
              type="submit"
              disabled={isSpent || isSubmitting || !inputValue.trim()}
              style={{
                flex: 1,
                padding: "var(--s-2)",
                borderRadius: "var(--r-cell)",
                border: "1px solid var(--action)",
                background: "var(--action)",
                color: "var(--paper-surface)",
                fontWeight: 600,
                fontSize: "12px",
                cursor: isSpent || isSubmitting ? "not-allowed" : "pointer",
                opacity: isSpent || isSubmitting ? 0.6 : 1,
              }}
            >
              {isSubmitting ? i18n.ticket.submitting : i18n.ticket.submitAnswer}
            </button>

            <button
              type="button"
              onClick={handleUncertain}
              disabled={isSpent || isSubmitting}
              style={{
                flex: 1,
                padding: "var(--s-2)",
                borderRadius: "var(--r-cell)",
                border: "1px solid var(--rule)",
                background: "var(--paper-ground)",
                color: "var(--ink)",
                fontWeight: 600,
                fontSize: "12px",
                cursor: isSpent || isSubmitting ? "not-allowed" : "pointer",
                opacity: isSpent || isSubmitting ? 0.6 : 1,
              }}
            >
              {i18n.ticket.cannotDetermine}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ marginTop: "var(--s-3)", display: "flex", gap: "var(--s-2)" }}>
          <button
            type="button"
            onClick={() => onAnswer(true)}
            disabled={isSpent || isSubmitting}
            style={{
              flex: 1,
              padding: "var(--s-2)",
              borderRadius: "var(--r-cell)",
              border: "1px solid var(--v-acc)",
              background: "var(--v-acc)",
              color: "var(--paper-surface)",
              fontWeight: 600,
              fontSize: "12px",
              cursor: isSpent || isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            [1] Chấp nhận đầu ra
          </button>
          <button
            type="button"
            onClick={() => onAnswer(false)}
            disabled={isSpent || isSubmitting}
            style={{
              flex: 1,
              padding: "var(--s-2)",
              borderRadius: "var(--r-cell)",
              border: "1px solid var(--v-code)",
              background: "var(--v-code)",
              color: "var(--paper-surface)",
              fontWeight: 600,
              fontSize: "12px",
              cursor: isSpent || isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            [2] Bác bỏ đầu ra
          </button>
          <button
            type="button"
            onClick={handleUncertain}
            disabled={isSpent || isSubmitting}
            style={{
              flex: 1,
              padding: "var(--s-2)",
              borderRadius: "var(--r-cell)",
              border: "1px solid var(--rule)",
              background: "var(--paper-ground)",
              color: "var(--ink)",
              fontWeight: 600,
              fontSize: "12px",
              cursor: isSpent || isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            [C] {i18n.ticket.cannotDetermine}
          </button>
        </div>
      )}

      {onDefer && !isSpent && (
        <div style={{ marginTop: "var(--s-2)", textAlign: "center" }}>
          <button
            type="button"
            onClick={onDefer}
            disabled={isSubmitting}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-soft)",
              fontSize: "11px",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {i18n.ticket.defer} ({i18n.ticket.deferNote})
          </button>
        </div>
      )}

      {isSpent && (
        <div
          style={{
            marginTop: "var(--s-3)",
            fontSize: "11px",
            color: "var(--ink-soft)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {ticket.isUncertain
            ? "Đã ghi nhận: Intent mơ hồ (không xác định được). Không hỏi lại tại witness này."
            : `Đã trả lời: ${String(ticket.answer)} lúc ${ticket.answeredAt ?? "trước đó"}`}
        </div>
      )}

      {errorMessage && (
        <div
          data-testid="ticket-error-message"
          style={{
            marginTop: "var(--s-2)",
            padding: "var(--s-2)",
            background: "var(--v-code-bg)",
            border: "1px solid var(--v-code)",
            borderRadius: "var(--r-cell)",
            color: "var(--v-code)",
            fontSize: "11px",
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
