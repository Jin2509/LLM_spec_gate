/**
 * src/ui/domain/ProvenanceTag.tsx — Provenance Tag Component
 *
 * Requirements:
 *   - Grounded: Solid border, crisp contrast.
 *   - Advisory: Dashed border, muted tone, clear note "không vào aggregator".
 *   - Zero hardcoded HEX colors.
 */
"use client";

import React from "react";
import type { ProvenanceSource, AdvisorySource } from "@/core/types";
import { i18n } from "@/i18n/vi";

export interface ProvenanceTagProps {
  isGrounded: boolean;
  source: ProvenanceSource | AdvisorySource;
  label?: string;
}

export function ProvenanceTag({
  isGrounded,
  source,
  label,
}: ProvenanceTagProps) {
  const sourceLabel =
    i18n.evidence.sources[source as keyof typeof i18n.evidence.sources] ?? source;

  return (
    <span
      data-testid="provenance-tag"
      data-grounded={isGrounded}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        whiteSpace: "nowrap",
        background: isGrounded ? "var(--accent-soft)" : "transparent",
        color: isGrounded ? "var(--ink)" : "var(--ink-soft)",
        border: isGrounded
          ? "1px solid var(--accent-line)"
          : "1px dashed var(--ink-soft)",
        fontStyle: isGrounded ? "normal" : "italic",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: isGrounded ? "var(--action)" : "var(--ink-soft)",
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      <span>{label ?? sourceLabel}</span>
      {!isGrounded && (
        <span
          data-testid="advisory-notice"
          style={{
            fontSize: "11px",
            color: "var(--v-spec)",
            padding: "0 6px",
            borderRadius: "999px",
            border: "1px solid var(--v-spec-line)",
            fontStyle: "normal",
          }}
        >
          {i18n.evidence.advisoryNotice}
        </span>
      )}
    </span>
  );
}
