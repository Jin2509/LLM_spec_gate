/**
 * src/ui/chat/AdjudicationLogic.tsx — Structured Adjudication Logic Viewer
 *
 * Requirements:
 *   - Structured presentation of Dual-Oracle monitoring formal logic:
 *       * Witness w, actual output c, expected output e(w) (if available)
 *       * Oracle P_0 rejection result and violated clause (e.g., ret == sorted(w))
 *       * Applied rule (R1-R6) + description + justification
 *   - Monospace code table with copy button
 *   - Collapsible with clear toggle
 */
"use client";

import React, { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import type { CaseDossier } from "@/core/types";

export interface AdjudicationLogicProps {
  caseDossier: CaseDossier;
}

export function AdjudicationLogic({ caseDossier }: AdjudicationLogicProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const rawJson = JSON.stringify(
    {
      witness_w: caseDossier.witness,
      actual_output_c: caseDossier.codeOutput,
      expected_output_e: caseDossier.adjudication.expectedOutput ?? null,
      oracle_p0_violation: caseDossier.monitorRejectionClause ?? null,
      matched_rule: caseDossier.adjudication.matchedRule,
      verdict: caseDossier.adjudication.verdict,
      explanation: caseDossier.adjudication.explanation,
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(rawJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      style={{
        marginTop: "10px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-app)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 10px",
          background: "var(--bg-panel)",
          borderBottom: isOpen ? "1px solid var(--border-subtle)" : "none",
        }}
      >
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            fontSize: "11px",
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Logic phán xử (Formal Rules R1–R6)
        </button>

        {isOpen && (
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Sao chép dữ liệu logic"
            style={{
              background: "none",
              border: "none",
              color: copied ? "var(--v-acc)" : "var(--text-muted)",
              fontSize: "10px",
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 6px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Đã sao chép" : "Sao chép JSON"}
          </button>
        )}
      </div>

      {isOpen && (
        <div style={{ padding: "8px 10px", fontSize: "11px" }}>
          {/* Table key-value */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "130px 1fr",
              gap: "6px",
              paddingBottom: "8px",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
              Witness w:
            </span>
            <code style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
              {JSON.stringify(caseDossier.witness)}
            </code>

            <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
              Đầu ra thực tế c:
            </span>
            <code style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
              {JSON.stringify(caseDossier.codeOutput)}
            </code>

            {caseDossier.adjudication.expectedOutput !== undefined && (
              <>
                <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
                  Kỳ vọng e(w):
                </span>
                <code style={{ fontFamily: "var(--font-mono)", color: "var(--v-acc)" }}>
                  {JSON.stringify(caseDossier.adjudication.expectedOutput)}
                </code>
              </>
            )}

            <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
              Kết quả P_0:
            </span>
            <span style={{ fontFamily: "var(--font-sans)" }}>
              {caseDossier.monitorRejectionClause ? (
                <span style={{ color: "var(--v-spec)", fontWeight: 500 }}>
                  Bác bỏ (Mệnh đề: <code>{caseDossier.monitorRejectionClause}</code>)
                </span>
              ) : (
                <span style={{ color: "var(--v-acc)", fontWeight: 500 }}>
                  Chấp nhận
                </span>
              )}
            </span>

            <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
              Luật áp dụng:
            </span>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600 }}>
              {caseDossier.adjudication.matchedRule} → {caseDossier.adjudication.verdict}
            </span>
          </div>

          <div style={{ marginTop: "8px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600 }}>Giải trình: </span>
            {caseDossier.adjudication.explanation}
          </div>
        </div>
      )}
    </div>
  );
}
