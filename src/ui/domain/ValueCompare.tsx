/**
 * src/ui/domain/ValueCompare.tsx — Value Comparison Component (≃)
 *
 * Requirements (Playbook Section 8.2):
 *   - Compares expected e(w) vs code output c with strict relation ≃
 *   - Three display modes:
 *       1. Inline diff: numbers, bools, short strings, flat arrays
 *       2. Tree diff: nested lists, tuples, dicts
 *       3. Text diff: multiline strings, long text
 *   - Displays type, ε (if any), and ≃ result
 *   - For non-unique tasks, shows warning note
 *   - Zero hardcoded HEX colors
 */
"use client";

import React, { useState } from "react";
import { areEquivalent } from "@/core/equivalence";
import { canonicalSerialize } from "@/core/serialize";
import { i18n } from "@/i18n/vi";

export type CompareMode = "inline" | "tree" | "text";

export interface ValueCompareProps {
  expected: unknown;
  actual: unknown;
  epsilon?: number;
  isUniqueOutput?: boolean;
  initialMode?: CompareMode;
}

export function pickCompareMode(actual: unknown, expected: unknown): CompareMode {
  if (
    (typeof actual === "string" && actual.includes("\n")) ||
    (typeof expected === "string" && expected.includes("\n")) ||
    (typeof actual === "string" && actual.length > 80) ||
    (typeof expected === "string" && expected.length > 80)
  ) {
    return "text";
  }

  const isNested = (v: unknown): boolean => {
    if (Array.isArray(v)) {
      return v.some((item) => typeof item === "object" && item !== null);
    }
    return typeof v === "object" && v !== null;
  };

  if (isNested(actual) || isNested(expected)) {
    return "tree";
  }

  return "inline";
}

export function ValueCompare({
  expected,
  actual,
  epsilon,
  isUniqueOutput = true,
  initialMode,
}: ValueCompareProps) {
  const [mode, setMode] = useState<CompareMode>(
    initialMode ?? pickCompareMode(actual, expected)
  );

  const equivResult = areEquivalent(actual, expected, { epsilon });
  const actualSerialized = canonicalSerialize(actual, { showTypeAnnotation: true });
  const expectedSerialized = canonicalSerialize(expected, { showTypeAnnotation: true });

  return (
    <div
      data-testid="value-compare"
      style={{
        border: "1px solid var(--rule)",
        borderRadius: "var(--r-card)",
        background: "var(--paper-surface)",
        padding: "var(--s-4)",
        fontFamily: "var(--font-mono)",
      }}
    >
      {/* ── Mode selector & Status ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--s-2)",
          marginBottom: "var(--s-3)",
          borderBottom: "1px solid var(--rule)",
          paddingBottom: "var(--s-2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: equivResult.equal ? "var(--v-acc)" : "var(--v-code)",
            }}
          >
            ≃ {equivResult.equal ? i18n.valueCompare.equal : i18n.valueCompare.notEqual}
          </span>
          <span style={{ fontSize: "11px", color: "var(--ink-soft)" }}>
            ({equivResult.reason})
          </span>
        </div>

        <div style={{ display: "flex", gap: "var(--s-1)" }}>
          {(["inline", "tree", "text"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: "2px 6px",
                fontSize: "11px",
                borderRadius: "var(--r-cell)",
                border: mode === m ? "1px solid var(--action)" : "1px solid var(--rule)",
                background: mode === m ? "var(--action)" : "transparent",
                color: mode === m ? "var(--paper-surface)" : "var(--ink)",
                cursor: "pointer",
              }}
            >
              {i18n.valueCompare.modes[m]}
            </button>
          ))}
        </div>
      </div>

      {!isUniqueOutput && (
        <div
          style={{
            fontSize: "11px",
            color: "var(--v-spec)",
            marginBottom: "var(--s-3)",
            fontFamily: "var(--font-ui)",
          }}
        >
          ℹ {i18n.valueCompare.nonUniqueNote}
        </div>
      )}

      {/* ── Mode 1: Inline Diff ── */}
      {mode === "inline" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--s-3)",
            fontSize: "12px",
          }}
        >
          <div
            style={{
              padding: "var(--s-2)",
              background: "var(--paper-ground)",
              borderRadius: "var(--r-cell)",
              border: "1px solid var(--rule)",
            }}
          >
            <div style={{ fontSize: "10px", color: "var(--ink-soft)", marginBottom: "4px" }}>
              {i18n.valueCompare.expected}
            </div>
            <div style={{ color: "var(--ink)", wordBreak: "break-all" }}>
              {expectedSerialized}
            </div>
          </div>

          <div
            style={{
              padding: "var(--s-2)",
              background: equivResult.equal ? "var(--v-acc-bg)" : "var(--v-code-bg)",
              borderRadius: "var(--r-cell)",
              border: equivResult.equal ? "1px solid var(--v-acc)" : "1px solid var(--v-code)",
            }}
          >
            <div style={{ fontSize: "10px", color: "var(--ink-soft)", marginBottom: "4px" }}>
              {i18n.valueCompare.actual}
            </div>
            <div style={{ color: "var(--ink)", wordBreak: "break-all" }}>
              {actualSerialized}
            </div>
          </div>
        </div>
      )}

      {/* ── Mode 2: Tree Diff ── */}
      {mode === "tree" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--s-3)",
            fontSize: "12px",
          }}
        >
          <pre
            style={{
              margin: 0,
              padding: "var(--s-2)",
              background: "var(--paper-ground)",
              borderRadius: "var(--r-cell)",
              border: "1px solid var(--rule)",
              overflow: "auto",
              maxHeight: "220px",
            }}
          >
            {JSON.stringify(expected, null, 2)}
          </pre>
          <pre
            style={{
              margin: 0,
              padding: "var(--s-2)",
              background: "var(--paper-ground)",
              borderRadius: "var(--r-cell)",
              border: equivResult.equal ? "1px solid var(--v-acc)" : "1px solid var(--v-code)",
              overflow: "auto",
              maxHeight: "220px",
            }}
          >
            {JSON.stringify(actual, null, 2)}
          </pre>
        </div>
      )}

      {/* ── Mode 3: Text Diff ── */}
      {mode === "text" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-2)",
            fontSize: "12px",
          }}
        >
          <div>
            <div style={{ fontSize: "10px", color: "var(--ink-soft)", marginBottom: "2px" }}>
              {i18n.valueCompare.expected}:
            </div>
            <pre
              style={{
                margin: 0,
                padding: "var(--s-2)",
                background: "var(--paper-ground)",
                borderRadius: "var(--r-cell)",
                border: "1px solid var(--rule)",
                overflowX: "auto",
              }}
            >
              {String(expected)}
            </pre>
          </div>
          <div>
            <div style={{ fontSize: "10px", color: "var(--ink-soft)", marginBottom: "2px" }}>
              {i18n.valueCompare.actual}:
            </div>
            <pre
              style={{
                margin: 0,
                padding: "var(--s-2)",
                background: equivResult.equal ? "var(--v-acc-bg)" : "var(--v-code-bg)",
                borderRadius: "var(--r-cell)",
                border: equivResult.equal ? "1px solid var(--v-acc)" : "1px solid var(--v-code)",
                overflowX: "auto",
              }}
            >
              {String(actual)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
