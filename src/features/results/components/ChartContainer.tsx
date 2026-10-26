"use client";

import { ChartColumn, Search, Table2, TriangleAlert, X } from "lucide-react";
import React, { useState } from "react";
import Link from "next/link";
import {
  type LinkedWitness,
  generateLatexTable,
  generateCsv,
  generateJson,
} from "@/core/results";

export interface ChartContainerProps {
  /** Run chứa các witness — dùng cho link "Mở Docket". */
  runId: string;
  rqId: string;
  title: string;
  sampleSize: number;
  description: string;
  tableHeaders: ReadonlyArray<string>;
  tableRows: ReadonlyArray<ReadonlyArray<string | number>>;
  rawData: unknown;
  selectedWitnesses: ReadonlyArray<LinkedWitness> | null;
  onClearWitnesses: () => void;
  children: React.ReactNode;
}

export function ChartContainer({
  runId,
  rqId,
  title,
  sampleSize,
  description,
  tableHeaders,
  tableRows,
  rawData,
  selectedWitnesses,
  onClearWitnesses,
  children,
}: ChartContainerProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const isSmallSample = sampleSize < 30;

  const handleCopyExport = (type: "latex" | "csv" | "json") => {
    let content = "";
    if (type === "latex") {
      content = generateLatexTable(title, tableHeaders, tableRows);
    } else if (type === "csv") {
      content = generateCsv(tableHeaders, tableRows);
    } else {
      content = generateJson(rawData);
    }

    navigator.clipboard?.writeText(content);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div
      data-testid={`chart-container-${rqId}`}
      className="flex flex-col gap-4 p-4 rounded border font-sans"
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderColor: "var(--rule)",
        borderRadius: "var(--radius-md)",
      }}
    >
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: "var(--rule)" }}>
        <div>
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-xs font-bold"
              style={{
                backgroundColor: "var(--paper-ground)",
                color: "var(--action)",
                border: "1px solid var(--action)",
              }}
            >
              {rqId.toUpperCase()}
            </span>
            <h2 className="text-base font-bold m-0" style={{ color: "var(--ink)" }}>
              {title}
            </h2>
          </div>
          <p className="text-xs m-0 mt-1 opacity-80" style={{ color: "var(--ink-soft)" }}>
            {description}
          </p>
        </div>

        {/* Controls: Sample Size & View Toggle & Exports */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Sample Size Badge */}
          <span
            data-testid="sample-size-badge"
            className="px-2.5 py-1 rounded border font-semibold"
            style={{
              backgroundColor: isSmallSample ? "var(--v-spec-bg)" : "var(--paper-ground)",
              borderColor: isSmallSample ? "var(--v-spec)" : "var(--rule)",
              color: isSmallSample ? "var(--v-spec)" : "var(--ink)",
            }}
          >
            Cỡ mẫu n = {sampleSize}
          </span>

          {/* Toggle View Mode */}
          <button
            data-testid="toggle-view-mode-btn"
            onClick={() => setViewMode((m) => (m === "chart" ? "table" : "chart"))}
            className="px-2.5 py-1 rounded border cursor-pointer font-semibold transition-colors"
            style={{
              backgroundColor: "var(--paper-ground)",
              borderColor: "var(--rule)",
              color: "var(--ink)",
            }}
          >
            {viewMode === "chart" ? <><Table2 size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" /> Xem dạng bảng</> : <><ChartColumn size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" /> Xem dạng biểu đồ</>}
          </button>

          {/* Export Buttons */}
          <div className="flex items-center gap-1 border-l pl-2" style={{ borderColor: "var(--rule)" }}>
            {(["latex", "csv", "json"] as const).map((t) => (
              <button
                key={t}
                data-testid={`export-btn-${t}`}
                onClick={() => handleCopyExport(t)}
                className="px-2 py-1 rounded border text-[11px] font-bold uppercase cursor-pointer"
                style={{
                  backgroundColor: copiedType === t ? "var(--v-acc-bg)" : "var(--paper-ground)",
                  borderColor: copiedType === t ? "var(--v-acc)" : "var(--rule)",
                  color: copiedType === t ? "var(--v-acc)" : "var(--ink-soft)",
                }}
              >
                {copiedType === t ? "Đã chép!" : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Small Sample Warning */}
      {isSmallSample && (
        <div
          data-testid="small-sample-warning"
          className="p-2.5 rounded border text-xs "
          style={{
            backgroundColor: "transparent",
            borderColor: "var(--v-spec)",
            borderStyle: "dashed",
            color: "var(--v-spec)",
          }}
        >
          <TriangleAlert size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" /> Cỡ mẫu n = {sampleSize} quá nhỏ (ngưỡng tối thiểu n ≥ 30). Hệ thống không vẽ đường spline làm mượt giả mạo.
        </div>
      )}

      {/* Main Content: Chart or Table */}
      <div className="min-h-[280px]">
        {viewMode === "chart" ? (
          children
        ) : (
          <div data-testid="table-view" className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--rule)" }}>
                  {tableHeaders.map((h, i) => (
                    <th key={i} className="text-left p-2 font-semibold" style={{ color: "var(--ink)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="border-b hover:bg-[var(--bg-hover)]"
                    style={{ borderColor: "var(--rule)" }}
                  >
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2" style={{ color: "var(--ink)" }}>
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Witness Drawer / Modal */}
      {selectedWitnesses && selectedWitnesses.length > 0 && (
        <div
          data-testid="witness-drawer"
          className="p-3 rounded border text-xs flex flex-col gap-2 transition-all"
          style={{
            backgroundColor: "var(--paper-ground)",
            borderColor: "var(--action)",
            borderWidth: "1.5px",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div className="flex items-center justify-between pb-1.5 border-b" style={{ borderColor: "var(--rule)" }}>
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: "var(--ink)" }}>
                <Search size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" /> Danh sách Witness Liên quan ({selectedWitnesses.length} ca)
              </span>
            </div>
            <button
              onClick={onClearWitnesses}
              className="px-2 py-0.5 rounded border text-[11px] cursor-pointer"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--rule)",
                color: "var(--ink-soft)",
              }}
            >
              <X size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" /> Đóng
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pt-1">
            {selectedWitnesses.map((w, idx) => (
              <div
                key={`${w.caseId}_${idx}`}
                data-testid={`witness-item-${w.caseId}`}
                className="p-2 rounded border flex flex-wrap items-center justify-between gap-2"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--rule)",
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <strong style={{ color: "var(--ink)" }}>{w.caseId}</strong>
                    <span style={{ color: "var(--ink-soft)" }}>({w.taskId})</span>
                    <span
                      className="px-1.5 py-0.2 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: "var(--paper-ground)",
                        color: "var(--action)",
                        border: "1px solid var(--rule)",
                      }}
                    >
                      {w.verdict}
                    </span>
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--ink-soft)" }}>
                    Witness w: <code>{w.witnessPreview}</code>
                    {w.note && <span className="ml-2 italic">— {w.note}</span>}
                  </div>
                </div>

                <Link
                  href={`/runs/${encodeURIComponent(runId)}/workbench?caseId=${encodeURIComponent(w.caseId)}`}
                  data-testid={`open-docket-btn-${w.caseId}`}
                  className="px-2.5 py-1 rounded text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  style={{
                    backgroundColor: "var(--action)",
                    color: "var(--bg-elevated)",
                    borderRadius: "var(--r-cell)",
                  }}
                >
                  Mở Docket →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mandatory Scientific Operational Ground Truth Disclaimer */}
      <div
        data-testid="operational-ground-truth-disclaimer"
        className="pt-2 border-t text-[11px] text-center opacity-75"
        style={{
          borderColor: "var(--rule)",
          color: "var(--ink-soft)",
        }}
      >
        Nhãn trên EvalPlus là nhãn vận hành, không phải chứng minh ngữ nghĩa.
      </div>
    </div>
  );
}
