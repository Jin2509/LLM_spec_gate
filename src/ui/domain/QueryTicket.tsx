/**
 * src/ui/domain/QueryTicket.tsx — Single-Shot Human Query Ticket Component
 *
 * Requirements:
 *   - Only active when UNKNOWN_EVIDENCE or UNKNOWN_CONFLICT.
 *   - UNKNOWN_GATE is disabled with explicit tooltip explanation:
 *     "Bằng chứng đã đủ; vấn đề nằm ở bản sửa đặc tả (repair), cấm tạo vé hỏi người."
 *   - Dạng 1 (UniqueOutput=true): Ask e(w), validate type as you type, code output hidden by default.
 *   - Dạng 2 (UniqueOutput=false): 3 buttons (Chấp nhận / Không chấp nhận / Không xác định được).
 *   - Submitting disables immediately (pessimistic update) -> permanent "ĐÃ SỬ DỤNG (SPENT)" stamp.
 *   - Zero hardcoded HEX colors.
 */
"use client";

import React, { useState } from "react";
import type { HumanQueryTicket, Verdict } from "@/core/types";
import { i18n } from "@/i18n/vi";

export interface QueryTicketProps {
  ticket: HumanQueryTicket;
  verdict?: Verdict;
  isUniqueOutput?: boolean;
  codeOutput?: unknown;
  onAnswer: (answer: unknown) => Promise<void>;
  onUncertain: () => Promise<void>;
  onDefer?: () => Promise<void>;
}

export function QueryTicket({
  ticket,
  verdict,
  isUniqueOutput = true,
  codeOutput,
  onAnswer,
  onUncertain,
  onDefer,
}: QueryTicketProps) {
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [showCodeOutput, setShowCodeOutput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSpent = ticket.status === "spent";
  const isUnknownGate = verdict === "UNKNOWN_GATE";

  // Validate input value as user types
  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (!val.trim()) {
      setInputError(null);
      return;
    }
    // Simple JSON / literal validator
    try {
      JSON.parse(val);
      setInputError(null);
    } catch {
      // Allow unquoted plain numbers or single words, otherwise warn
      if (/^-?\d+(\.\d+)?$/.test(val.trim())) {
        setInputError(null);
      } else {
        setInputError("Lưu ý: Chuỗi cần đặt trong nháy kép \"...\", danh sách dạng [1, 2]");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSpent || isSubmitting || isUnknownGate) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      let parsedValue: unknown = inputValue.trim();
      try {
        parsedValue = JSON.parse(inputValue);
      } catch {
        // If it's a number
        if (/^-?\d+(\.\d+)?$/.test(inputValue.trim())) {
          parsedValue = Number(inputValue.trim());
        }
      }
      await onAnswer(parsedValue);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : i18n.ticket.alreadySpentError;
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUncertain = async () => {
    if (isSpent || isSubmitting || isUnknownGate) return;
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

  const handleBooleanAnswer = async (accepted: boolean) => {
    if (isSpent || isSubmitting || isUnknownGate) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onAnswer(accepted);
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
      data-unknown-gate={isUnknownGate ? "true" : "false"}
      style={{
        position: "relative",
        borderRadius: "var(--r-ticket)",
        border: isUnknownGate
          ? "1.5px dashed var(--v-unknown)"
          : "1.5px solid var(--rule)",
        background: isUnknownGate
          ? "transparent"
          : "var(--paper-surface)",
        padding: "var(--s-4)",
        fontFamily: "var(--font-ui)",
        maxWidth: "460px",
        overflow: "hidden",
        opacity: isUnknownGate ? 0.7 : 1,
      }}
    >
      {/* ── UNKNOWN_GATE Disabled Notice ── */}
      {isUnknownGate && (
        <div
          data-testid="unknown-gate-tooltip"
          style={{
            marginBottom: "var(--s-3)",
            padding: "var(--s-2)",
            borderRadius: "var(--r-cell)",
            border: "1px dashed var(--v-spec)",
            background: "var(--v-spec-bg)",
            color: "var(--v-spec)",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
          }}
        >
          ⚠️ <strong>{i18n.verdicts.UNKNOWN_GATE}:</strong> {i18n.ticket.unknownGateForbidden}
        </div>
      )}

      {/* ── Spent Stamp Overlay ── */}
      {isSpent && (
        <div
          data-testid="spent-stamp"
          className="animate-in zoom-in-75 duration-300"
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

      {/* ── Form 1: UniqueOutput = true (Ask expected output e(w)) ── */}
      {isUniqueOutput ? (
        <form onSubmit={handleSubmit} style={{ marginTop: "var(--s-3)" }}>
          {/* Default hidden code output to avoid bias */}
          {codeOutput !== undefined && (
            <div style={{ marginBottom: "var(--s-2)", fontSize: "11px" }}>
              <button
                type="button"
                onClick={() => setShowCodeOutput((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--ink-soft)",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {showCodeOutput ? "▲ Ẩn đầu ra của code" : "▼ Hiện đầu ra của code (c)"}
              </button>
              {showCodeOutput && (
                <div
                  style={{
                    marginTop: "4px",
                    padding: "4px 8px",
                    borderRadius: "var(--r-cell)",
                    background: "var(--paper-ground)",
                    border: "1px solid var(--rule)",
                    fontFamily: "var(--font-mono)",
                    color: "var(--ink)",
                  }}
                >
                  c(w) = {String(codeOutput)}
                </div>
              )}
            </div>
          )}

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
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={isSpent || isSubmitting || isUnknownGate}
            placeholder="Ví dụ: 42 hoặc [1, 2, 3]"
            style={{
              width: "100%",
              padding: "var(--s-2)",
              borderRadius: "var(--r-cell)",
              border: inputError ? "1px solid var(--v-spec)" : "1px solid var(--rule)",
              background: "var(--paper-ground)",
              color: "var(--ink)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              boxSizing: "border-box",
              marginBottom: inputError ? "2px" : "var(--s-3)",
            }}
          />

          {inputError && (
            <div
              style={{
                fontSize: "11px",
                color: "var(--v-spec)",
                marginBottom: "var(--s-2)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {inputError}
            </div>
          )}

          <div style={{ display: "flex", gap: "var(--s-2)" }}>
            <button
              type="submit"
              disabled={isSpent || isSubmitting || isUnknownGate || !inputValue.trim()}
              style={{
                flex: 1,
                padding: "var(--s-2)",
                borderRadius: "var(--r-cell)",
                border: "1px solid var(--action)",
                background: "var(--action)",
                color: "var(--paper-surface)",
                fontWeight: 600,
                fontSize: "12px",
                cursor: isSpent || isSubmitting || isUnknownGate ? "not-allowed" : "pointer",
                opacity: isSpent || isSubmitting || isUnknownGate ? 0.6 : 1,
              }}
            >
              {isSubmitting ? i18n.ticket.submitting : i18n.ticket.submitAnswer}
            </button>

            <button
              type="button"
              onClick={handleUncertain}
              disabled={isSpent || isSubmitting || isUnknownGate}
              style={{
                flex: 1,
                padding: "var(--s-2)",
                borderRadius: "var(--r-cell)",
                border: "1px solid var(--rule)",
                background: "var(--paper-ground)",
                color: "var(--ink)",
                fontWeight: 600,
                fontSize: "12px",
                cursor: isSpent || isSubmitting || isUnknownGate ? "not-allowed" : "pointer",
                opacity: isSpent || isSubmitting || isUnknownGate ? 0.6 : 1,
              }}
            >
              [C] {i18n.ticket.cannotDetermine}
            </button>
          </div>
        </form>
      ) : (
        /* ── Form 2: UniqueOutput = false (3 buttons: Accept / Reject / Uncertain) ── */
        <div style={{ marginTop: "var(--s-3)", display: "flex", gap: "var(--s-2)" }}>
          <button
            type="button"
            onClick={() => handleBooleanAnswer(true)}
            disabled={isSpent || isSubmitting || isUnknownGate}
            style={{
              flex: 1,
              padding: "var(--s-2)",
              borderRadius: "var(--r-cell)",
              border: "1px solid var(--v-acc)",
              background: "var(--v-acc)",
              color: "var(--paper-surface)",
              fontWeight: 600,
              fontSize: "12px",
              cursor: isSpent || isSubmitting || isUnknownGate ? "not-allowed" : "pointer",
              opacity: isSpent || isSubmitting || isUnknownGate ? 0.6 : 1,
            }}
          >
            [1] Chấp nhận
          </button>
          <button
            type="button"
            onClick={() => handleBooleanAnswer(false)}
            disabled={isSpent || isSubmitting || isUnknownGate}
            style={{
              flex: 1,
              padding: "var(--s-2)",
              borderRadius: "var(--r-cell)",
              border: "1px solid var(--v-code)",
              background: "var(--v-code)",
              color: "var(--paper-surface)",
              fontWeight: 600,
              fontSize: "12px",
              cursor: isSpent || isSubmitting || isUnknownGate ? "not-allowed" : "pointer",
              opacity: isSpent || isSubmitting || isUnknownGate ? 0.6 : 1,
            }}
          >
            [2] Không chấp nhận
          </button>
          <button
            type="button"
            onClick={handleUncertain}
            disabled={isSpent || isSubmitting || isUnknownGate}
            style={{
              flex: 1,
              padding: "var(--s-2)",
              borderRadius: "var(--r-cell)",
              border: "1px solid var(--rule)",
              background: "var(--paper-ground)",
              color: "var(--ink)",
              fontWeight: 600,
              fontSize: "12px",
              cursor: isSpent || isSubmitting || isUnknownGate ? "not-allowed" : "pointer",
              opacity: isSpent || isSubmitting || isUnknownGate ? 0.6 : 1,
            }}
          >
            [C] {i18n.ticket.cannotDetermine}
          </button>
        </div>
      )}

      {onDefer && !isSpent && !isUnknownGate && (
        <div style={{ marginTop: "var(--s-2)", textAlign: "center" }}>
          <button
            type="button"
            onClick={onDefer}
            disabled={isSubmitting}
            title={i18n.ticket.deferNote}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-soft)",
              fontSize: "11px",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            [S] {i18n.ticket.defer} ({i18n.ticket.deferNote})
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
