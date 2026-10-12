/**
 * src/ui/domain/RuleLadder.tsx — Rule Inspector Ladder (R1–R6)
 *
 * Requirements:
 *   - Shows all 6 rules in application sequence.
 *   - The matched rule is highlighted with verdict indicator.
 *   - Preceding/skipped rules display the exact reason why they did not match.
 *   - Zero hardcoded HEX colors.
 */
"use client";

import React from "react";
import type { RuleId } from "@/core/types";

export interface RuleLadderProps {
  matchedRule: RuleId;
  skippedRules: ReadonlyArray<{ rule: RuleId; reason: string }>;
}

const ALL_RULES: ReadonlyArray<{ id: RuleId; name: string; condition: string }> = [
  { id: "R1", name: "R1: Conflict", condition: "Grounded sources mâu thuẫn nhau → UNKNOWN_CONFLICT" },
  { id: "R2", name: "R2: Spec Fault", condition: "c = e(w) và P0 bác e(w) → SPEC_FAULT" },
  { id: "R3", name: "R3: Dual Fault (Scalar)", condition: "c ≠ e(w) và P0 cũng bác e(w) → DUAL_FAULT" },
  { id: "R4", name: "R4: Dual Fault (Property)", condition: "c và P0 cùng vi phạm thuộc tính φ → DUAL_FAULT" },
  { id: "R5", name: "R5: Code Fault", condition: "c vi phạm e(w) hoặc φ nhưng P0 chấp nhận → CODE_FAULT" },
  { id: "R6", name: "R6: Unknown Evidence", condition: "Không đủ bằng chứng grounded tại w → UNKNOWN_EVIDENCE" },
];

export function RuleLadder({ matchedRule, skippedRules }: RuleLadderProps) {
  const skippedMap = new Map<RuleId, string>(
    skippedRules.map((s) => [s.rule, s.reason])
  );

  return (
    <div
      role="region"
      aria-label="Bậc thang quy tắc phân xử R1–R6"
      data-testid="rule-ladder"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-2)",
        fontFamily: "var(--font-mono)",
      }}
    >
      {ALL_RULES.map((rule) => {
        const isMatched = rule.id === matchedRule;
        const skippedReason = skippedMap.get(rule.id);

        return (
          <div
            key={rule.id}
            data-testid={`rule-item-${rule.id}`}
            data-matched={isMatched}
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              gap: "var(--s-3)",
              alignItems: "center",
              padding: "var(--s-2) var(--s-3)",
              borderRadius: "var(--r-card)",
              border: isMatched
                ? "1.5px solid var(--action)"
                : "1px solid var(--rule)",
              background: isMatched
                ? "var(--paper-surface)"
                : "transparent",
              transition: "border-color var(--motion-quick) ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "var(--r-cell)",
                  background: isMatched ? "var(--action)" : "transparent",
                  color: isMatched ? "var(--paper-surface)" : "var(--ink-soft)",
                  border: isMatched ? "none" : "1px solid var(--rule)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                {isMatched ? "✓" : "○"}
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: isMatched ? 600 : 400,
                  color: isMatched ? "var(--ink)" : "var(--ink-soft)",
                }}
              >
                {rule.id}
              </span>
            </div>

            <div style={{ fontSize: "11px" }}>
              <div
                style={{
                  color: isMatched ? "var(--ink)" : "var(--ink-soft)",
                  fontWeight: isMatched ? 500 : 400,
                }}
              >
                {rule.condition}
              </div>
              {skippedReason && !isMatched && (
                <div
                  style={{
                    color: "var(--ink-soft)",
                    fontSize: "10px",
                    marginTop: "2px",
                    fontStyle: "italic",
                  }}
                >
                  Bỏ qua: {skippedReason}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
