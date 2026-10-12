"use client";

import React, { useState } from "react";
import type { RepairCandidate } from "@/core/types";

export interface SpecCodeViewerProps {
  functionCode?: string;
  monitorCode: string;
  rejectionClause?: string;
  repairCandidate?: RepairCandidate;
}

export function SpecCodeViewer({
  functionCode = `def solve(w):\n    # Code implementation\n    return sorted(w)`,
  monitorCode,
  rejectionClause,
  repairCandidate,
}: SpecCodeViewerProps) {
  const [activeTab, setActiveTab] = useState<"code" | "monitor" | "diff">("monitor");

  return (
    <div
      data-testid="spec-code-viewer"
      className="h-full flex flex-col border rounded overflow-hidden shadow-sm"
      style={{
        backgroundColor: "var(--paper-surface)",
        borderColor: "var(--rule)",
        borderRadius: "var(--r-card)",
      }}
    >
      {/* Header Tabs */}
      <div
        className="flex items-center border-b px-2 text-xs font-mono select-none"
        style={{
          backgroundColor: "var(--paper-ground)",
          borderColor: "var(--rule)",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("monitor")}
          className={`px-3 py-2 border-b-2 -mb-[1px] transition-colors cursor-pointer ${
            activeTab === "monitor"
              ? "font-semibold border-[var(--action)] text-[var(--action)]"
              : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          Monitor P_0
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("code")}
          className={`px-3 py-2 border-b-2 -mb-[1px] transition-colors cursor-pointer ${
            activeTab === "code"
              ? "font-semibold border-[var(--action)] text-[var(--action)]"
              : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          Mã nguồn Code (c)
        </button>

        {repairCandidate && (
          <button
            type="button"
            onClick={() => setActiveTab("diff")}
            className={`px-3 py-2 border-b-2 -mb-[1px] transition-colors cursor-pointer ${
              activeTab === "diff"
                ? "font-semibold border-[var(--action)] text-[var(--action)]"
                : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
            }`}
          >
            Diff P_k → P&apos;
          </button>
        )}
      </div>

      {/* Code Display Area */}
      <div
        className="flex-1 p-3 overflow-auto font-mono text-xs leading-relaxed"
        style={{
          backgroundColor: "var(--paper-surface)",
          color: "var(--ink)",
          fontVariantLigatures: "none",
        }}
      >
        {activeTab === "monitor" && (
          <div>
            <div className="text-[10px] text-[var(--ink-soft)] mb-2">
              # Đặc tả Monitor P0 đang giám sát runtime:
            </div>
            <pre className="whitespace-pre-wrap">
              {monitorCode.split("\n").map((line, idx) => {
                const isViolationLine =
                  rejectionClause && line.includes(rejectionClause);

                return (
                  <div
                    key={idx}
                    className={`px-1 rounded ${
                      isViolationLine ? "border-l-2 border-[var(--v-code)] font-semibold" : ""
                    }`}
                    style={{
                      backgroundColor: isViolationLine ? "var(--v-code-bg)" : "transparent",
                      color: isViolationLine ? "var(--v-code)" : "var(--ink)",
                    }}
                  >
                    <span className="opacity-40 inline-block w-6 select-none">
                      {idx + 1}
                    </span>
                    <span>{line}</span>
                  </div>
                );
              })}
            </pre>
          </div>
        )}

        {activeTab === "code" && (
          <div>
            <div className="text-[10px] text-[var(--ink-soft)] mb-2">
              # Hàm sinh bởi mô hình (Candidate Code):
            </div>
            <pre className="whitespace-pre-wrap">
              {functionCode.split("\n").map((line, idx) => (
                <div key={idx} className="px-1">
                  <span className="opacity-40 inline-block w-6 select-none">
                    {idx + 1}
                  </span>
                  <span>{line}</span>
                </div>
              ))}
            </pre>
          </div>
        )}

        {activeTab === "diff" && repairCandidate && (
          <div>
            <div className="text-[10px] text-[var(--ink-soft)] mb-2">
              # Bản sửa đặc tả đề xuất (Grammar repair candidate #{repairCandidate.rank}):
            </div>
            <div
              className="p-2 mb-3 rounded border"
              style={{
                backgroundColor: "var(--paper-ground)",
                borderColor: "var(--rule)",
                borderRadius: "var(--r-cell)",
              }}
            >
              <div><strong>Họ sửa (Family):</strong> {repairCandidate.family}</div>
              <div><strong>Guard (g):</strong> {repairCandidate.guard}</div>
              <div><strong>Thay thế (C&apos;):</strong> {repairCandidate.replacement}</div>
            </div>

            <pre className="whitespace-pre-wrap">
              <div
                className="px-1 rounded border-l-2 border-[var(--v-code)]"
                style={{ backgroundColor: "var(--v-code-bg)", color: "var(--v-code)" }}
              >
                - {rejectionClause || "assert ret == sorted(w)"}
              </div>
              <div
                className="px-1 rounded border-l-2 border-[var(--v-acc)]"
                style={{ backgroundColor: "var(--v-acc-bg)", color: "var(--v-acc)" }}
              >
                + if ({repairCandidate.guard}): return ({repairCandidate.replacement})
              </div>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
