/**
 * src/ui/domain/InvariantBar.tsx — Invariant Status Bar
 *
 * Displays research integrity invariants:
 *   - G ∩ B = ∅ (Disjoint trace sets)
 *   - Held-out partition structural lock
 *   - Human query tickets used / total
 *   - Rejected write attempts counter
 *
 * Zero hardcoded HEX colors.
 */
"use client";

import React from "react";
import { i18n } from "@/i18n/vi";

export interface InvariantBarProps {
  isDisjointGB: boolean;
  isHeldOutLocked: boolean;
  ticketsSpent: number;
  ticketsTotal: number;
  rejectedWritesCount: number;
}

export function InvariantBar({
  isDisjointGB,
  isHeldOutLocked,
  ticketsSpent,
  ticketsTotal,
  rejectedWritesCount,
}: InvariantBarProps) {
  return (
    <div
      role="region"
      aria-label="Thanh trạng thái bất biến nghiên cứu"
      data-testid="invariant-bar"
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "var(--s-4)",
        padding: "var(--s-2) var(--s-3)",
        background: "var(--paper-surface)",
        border: "1px solid var(--rule)",
        borderRadius: "var(--r-card)",
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
      }}
    >
      {/* 1. G ∩ B = ∅ */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: isDisjointGB ? "var(--v-acc)" : "var(--v-code)",
          }}
          aria-hidden="true"
        />
        <span style={{ color: "var(--ink)", fontWeight: 600 }}>
          {i18n.invariants.disjointGB}
        </span>
        <span style={{ color: isDisjointGB ? "var(--v-acc)" : "var(--v-code)", fontSize: "11px" }}>
          {isDisjointGB ? "✓ Thoả mãn" : "✗ Vi phạm"}
        </span>
      </div>

      {/* 2. Held-out Lock */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: isHeldOutLocked ? "var(--v-acc)" : "var(--v-code)",
          }}
          aria-hidden="true"
        />
        <span style={{ color: "var(--ink)" }}>
          {i18n.invariants.heldOutLocked}
        </span>
        <span style={{ color: isHeldOutLocked ? "var(--v-acc)" : "var(--v-code)", fontSize: "11px" }}>
          {isHeldOutLocked ? "✓ Khóa cứng" : "✗ Chưa khóa"}
        </span>
      </div>

      {/* 3. Tickets spent / total */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ color: "var(--ink-soft)" }}>{i18n.invariants.ticketsUsed}:</span>
        <span style={{ color: "var(--ink)", fontWeight: 600 }}>
          {ticketsSpent} / {ticketsTotal}
        </span>
      </div>

      {/* 4. Rejected writes count */}
      {rejectedWritesCount > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "var(--v-spec)" }}>
            ⚠ {i18n.invariants.rejectedWrites}: {rejectedWritesCount}
          </span>
        </div>
      )}
    </div>
  );
}
