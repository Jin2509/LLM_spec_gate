/**
 * src/ui/chat/VerdictCard.tsx — Structured Verdict Result Card with Token Streamed Explanation
 *
 * Requirements:
 *   - Final verdict badge
 *   - Formatted Actual output (c), P_0 rejection status, matched rule
 *   - Token streamed text explanation
 *   - Action link to open Inspector with ArrowUpRight
 *   - Zero hardcoded HEX colors
 */
"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUpRight } from "lucide-react";
import { VerdictChip } from "@/ui/domain";
import type { Verdict, RuleId } from "@/core/types";

export interface VerdictCardProps {
  verdict: Verdict;
  codeOutput: unknown;
  monitorRejectionClause?: string;
  matchedRule: RuleId;
  explanation: string;
  onOpenInspector: () => void;
}

export function VerdictCard({
  verdict,
  codeOutput,
  monitorRejectionClause,
  matchedRule,
  explanation,
  onOpenInspector,
}: VerdictCardProps) {
  return (
    <div
      style={{
        marginTop: "12px",
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-default)",
        background: "var(--bg-elevated, var(--bg-panel))",
      }}
    >
      {/* Top row: Verdict Chip + Open Inspector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <VerdictChip verdict={verdict} showFullLabel />
          <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            ({matchedRule})
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenInspector}
          aria-label="Xem bằng chứng và luật áp dụng"
          style={{
            background: "none",
            border: "none",
            color: "var(--accent)",
            fontSize: "11px",
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            fontWeight: 500,
          }}
        >
          Xem bằng chứng &amp; luật áp dụng
          <ArrowUpRight size={12} />
        </button>
      </div>

      {/* Key-value summary rows */}
      <div
        style={{
          padding: "8px 10px",
          background: "var(--bg-app)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-subtle)",
          marginBottom: "10px",
          fontSize: "11px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <span style={{ color: "var(--text-muted)", width: "110px", flexShrink: 0 }}>
            Đầu ra thực tế (c):
          </span>
          <code style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
            {JSON.stringify(codeOutput)}
          </code>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <span style={{ color: "var(--text-muted)", width: "110px", flexShrink: 0 }}>
            Đặc tả P_0:
          </span>
          <span style={{ fontFamily: "var(--font-sans)" }}>
            {monitorRejectionClause ? (
              <span style={{ color: "var(--v-spec)", fontWeight: 500 }}>
                BÁC BỎ (Mệnh đề: <code>{monitorRejectionClause}</code>)
              </span>
            ) : (
              <span style={{ color: "var(--v-acc)", fontWeight: 500 }}>
                CHẤP NHẬN
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Streamed or completed explanation markdown */}
      <div
        style={{
          fontSize: "13px",
          lineHeight: 1.6,
          color: "var(--text-primary)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
      </div>
    </div>
  );
}
