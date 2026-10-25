"use client";

import React, { useState } from "react";
import type { LinkedWitness } from "@/reporting/results-data";
import type { RQData } from "@/lib/api/types";

/** Dữ liệu biểu đồ đến từ GET /api/runs/[id]/results/[rq] (xem api.md). */
export interface ChartProps<R extends RQData["rq"]> {
  data: Extract<RQData, { rq: R }>;
  onSelectWitnesses: (witnesses: ReadonlyArray<LinkedWitness>) => void;
}

/** Trục biểu đồ suy ra từ dữ liệu backend, giữ thứ tự xuất hiện. */
function uniqueInOrder<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

// ── RQ1: Stacked Bar Chart ────────────────────────────────────────────────────
export function RQ1Chart({ data, onSelectWitnesses }: ChartProps<"rq1">) {
  return (
    <div data-testid="rq1-chart" className="flex flex-col gap-4 font-mono text-xs">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {data.categories.map((item, idx) => (
          <div
            key={idx}
            data-testid={`rq1-bar-${idx}`}
            onClick={() => onSelectWitnesses(item.witnesses)}
            className="p-3 rounded border cursor-pointer hover:border-[var(--action)] transition-all flex flex-col gap-2"
            style={{
              backgroundColor: "var(--paper-ground)",
              borderColor: "var(--rule)",
            }}
          >
            <div className="font-semibold text-xs" style={{ color: "var(--ink)" }}>
              {item.category}
            </div>

            <div className="flex items-end gap-3 h-28 pt-2">
              {/* Before filter bar */}
              <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[10px]" style={{ color: "var(--v-code)" }}>{item.beforeCount}</span>
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${(item.beforeCount / 70) * 100}%`,
                    backgroundColor: "var(--v-code)",
                    opacity: 0.8,
                  }}
                />
                <span className="text-[10px]" style={{ color: "var(--ink-soft)" }}>Trước</span>
              </div>

              {/* After filter bar */}
              <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[10px]" style={{ color: "var(--v-acc)" }}>{item.afterCount}</span>
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${(item.afterCount / 70) * 100}%`,
                    backgroundColor: "var(--v-acc)",
                  }}
                />
                <span className="text-[10px]" style={{ color: "var(--ink-soft)" }}>Sau lọc</span>
              </div>
            </div>

            <div className="text-[11px] pt-1 border-t flex justify-between" style={{ borderColor: "var(--rule)" }}>
              <span style={{ color: "var(--ink-soft)" }}>Giảm thiểu:</span>
              <strong style={{ color: "var(--action)" }}>-{item.reductionRatio}%</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── RQ2: Risk-Coverage Curves & 4-Class Confusion Matrix ───────────────────────
export function RQ2Chart({ data, onSelectWitnesses }: ChartProps<"rq2">) {
  const [activeMode, setActiveMode] = useState<"fail_closed" | "fail_open">("fail_closed");

  const method = data.methods.find((m) => m.id === activeMode) ?? data.methods[0];
  if (!method) return null;

  return (
    <div data-testid="rq2-chart" className="flex flex-col gap-5 font-mono text-xs">
      {/* Side-by-side mode switch */}
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--ink-soft)" }}>Chế độ phân xử:</span>
        <button
          data-testid="toggle-fail-closed"
          onClick={() => setActiveMode("fail_closed")}
          className="px-2.5 py-1 rounded border font-semibold cursor-pointer"
          style={{
            backgroundColor: activeMode === "fail_closed" ? "var(--action)" : "var(--paper-ground)",
            color: activeMode === "fail_closed" ? "var(--paper-surface)" : "var(--ink)",
            borderColor: activeMode === "fail_closed" ? "var(--action)" : "var(--rule)",
          }}
        >
          Fail-Closed (Đề xuất)
        </button>
        <button
          data-testid="toggle-fail-open"
          onClick={() => setActiveMode("fail_open")}
          className="px-2.5 py-1 rounded border font-semibold cursor-pointer"
          style={{
            backgroundColor: activeMode === "fail_open" ? "var(--action)" : "var(--paper-ground)",
            color: activeMode === "fail_open" ? "var(--paper-surface)" : "var(--ink)",
            borderColor: activeMode === "fail_open" ? "var(--action)" : "var(--rule)",
          }}
        >
          Fail-Open (Đối chứng)
        </button>
      </div>

      {/* SVG Pareto Risk-Coverage Curve */}
      <div
        className="p-3 rounded border flex flex-col gap-2"
        style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)" }}
      >
        <div className="flex justify-between text-[11px]" style={{ color: "var(--ink-soft)" }}>
          <span>Đường cong Risk-Coverage Pareto (Click vào điểm để mở witness)</span>
          <span>Coverage → | Risk ↓</span>
        </div>

        <svg viewBox="0 0 500 160" className="w-full h-40">
          {/* Axis lines */}
          <line x1="40" y1="10" x2="40" y2="130" stroke="var(--rule)" strokeWidth="1.5" />
          <line x1="40" y1="130" x2="480" y2="130" stroke="var(--rule)" strokeWidth="1.5" />

          {/* Grid labels */}
          <text x="5" y="20" fill="var(--ink-soft)" fontSize="9">Risk</text>
          <text x="440" y="145" fill="var(--ink-soft)" fontSize="9">Coverage</text>

          {/* Points and connect line */}
          {method.points.map((pt, i) => {
            const cx = 40 + (pt.coverage / 100) * 420;
            const cy = 130 - (pt.risk / 40) * 110;
            const prev = method.points[i - 1];
            const prevX = prev ? 40 + (prev.coverage / 100) * 420 : cx;
            const prevY = prev ? 130 - (prev.risk / 40) * 110 : cy;

            return (
              <g key={i}>
                {prev && (
                  <line
                    x1={prevX}
                    y1={prevY}
                    x2={cx}
                    y2={cy}
                    stroke="var(--action)"
                    strokeWidth="2"
                    strokeDasharray={activeMode === "fail_open" ? "4,4" : undefined}
                  />
                )}
                <circle
                  data-testid={`risk-coverage-point-${i}`}
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill="var(--action)"
                  stroke="var(--paper-surface)"
                  strokeWidth="1.5"
                  className="cursor-pointer hover:r-7 transition-all"
                  onClick={() => onSelectWitnesses(pt.witnesses)}
                />
                <text x={cx - 10} y={cy - 8} fill="var(--ink)" fontSize="9" fontWeight="bold">
                  {pt.coverage}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 4-Class Confusion Matrix */}
      <div>
        <span className="font-semibold block mb-2" style={{ color: "var(--ink)" }}>
          Ma trận nhầm lẫn 4 lớp (Adjudicator Confusion Matrix)
        </span>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse border" style={{ borderColor: "var(--rule)" }}>
            <thead>
              <tr className="border-b" style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)" }}>
                <th className="p-2 border-r text-left" style={{ borderColor: "var(--rule)" }}>Thực tế \ Dự đoán</th>
                <th className="p-2 border-r text-center" style={{ borderColor: "var(--rule)" }}>ACC</th>
                <th className="p-2 border-r text-center" style={{ borderColor: "var(--rule)" }}>SPEC_FAULT</th>
                <th className="p-2 border-r text-center" style={{ borderColor: "var(--rule)" }}>CODE_FAULT</th>
                <th className="p-2 text-center">DUAL_FAULT</th>
              </tr>
            </thead>
            <tbody>
              {data.confusionMatrix.map((row, rIdx) => (
                <tr key={rIdx} className="border-b" style={{ borderColor: "var(--rule)" }}>
                  <td className="p-2 border-r font-semibold" style={{ borderColor: "var(--rule)" }}>{row.trueClass}</td>
                  <td
                    data-testid={`matrix-cell-${rIdx}-acc`}
                    onClick={() => onSelectWitnesses(row.witnesses)}
                    className="p-2 border-r text-center cursor-pointer hover:bg-black/5"
                    style={{ borderColor: "var(--rule)" }}
                  >
                    {row.predAcc}
                  </td>
                  <td
                    data-testid={`matrix-cell-${rIdx}-spec`}
                    onClick={() => onSelectWitnesses(row.witnesses)}
                    className="p-2 border-r text-center cursor-pointer hover:bg-black/5"
                    style={{ borderColor: "var(--rule)" }}
                  >
                    {row.predSpec}
                  </td>
                  <td
                    data-testid={`matrix-cell-${rIdx}-code`}
                    onClick={() => onSelectWitnesses(row.witnesses)}
                    className="p-2 border-r text-center cursor-pointer hover:bg-black/5"
                    style={{ borderColor: "var(--rule)" }}
                  >
                    {row.predCode}
                  </td>
                  <td
                    data-testid={`matrix-cell-${rIdx}-dual`}
                    onClick={() => onSelectWitnesses(row.witnesses)}
                    className="p-2 text-center cursor-pointer hover:bg-black/5"
                  >
                    {row.predDual}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── RQ3: Ablation Heatmap A0-A3 x Evidence Sources ───────────────────────────
export function RQ3Chart({ data, onSelectWitnesses }: ChartProps<"rq3">) {
  const levels = uniqueInOrder(data.cells.map((c) => c.anchorLevel)).sort();
  const sources = uniqueInOrder(data.cells.map((c) => c.source));

  return (
    <div data-testid="rq3-chart" className="flex flex-col gap-3 font-mono text-xs">
      <span className="font-semibold" style={{ color: "var(--ink)" }}>
        Ma trận độ chính xác Ablation (A0–A3 × Nguồn chứng cứ)
      </span>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-collapse border" style={{ borderColor: "var(--rule)" }}>
          <thead>
            <tr className="border-b" style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)" }}>
              <th className="p-2 border-r text-left" style={{ borderColor: "var(--rule)" }}>Mức Anchor</th>
              {sources.map((s, i) => (
                <th key={i} className="p-2 border-r text-center" style={{ borderColor: "var(--rule)" }}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {levels.map((lvl) => (
              <tr key={lvl} className="border-b" style={{ borderColor: "var(--rule)" }}>
                <td className="p-2 border-r font-bold" style={{ borderColor: "var(--rule)" }}>{lvl}</td>
                {sources.map((src, sIdx) => {
                  const cell = data.cells.find((c) => c.anchorLevel === lvl && c.source === src);
                  const val = cell?.accuracy ?? 0;
                  const intensity = Math.min(1, Math.max(0.2, (val - 40) / 60));

                  return (
                    <td
                      key={sIdx}
                      data-testid={`ablation-cell-${lvl}-${sIdx}`}
                      onClick={() => onSelectWitnesses(cell?.witnesses ?? [])}
                      className="p-3 border-r text-center cursor-pointer font-bold hover:scale-105 transition-all"
                      style={{
                        borderColor: "var(--rule)",
                        backgroundColor: `rgba(47, 75, 192, ${intensity * 0.3})`,
                        color: "var(--ink)",
                      }}
                    >
                      {val.toFixed(1)}%
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── RQ4: Correlation Heatmap Coder x Spec on SILENT_FAULT ────────────────────
export function RQ4Chart({ data, onSelectWitnesses }: ChartProps<"rq4">) {
  const models = uniqueInOrder(data.cells.flatMap((c) => [c.coder, c.spec]));

  return (
    <div data-testid="rq4-chart" className="flex flex-col gap-3 font-mono text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold" style={{ color: "var(--ink)" }}>
          Tương quan Lỗi Âm thầm (SILENT_FAULT Rate: Coder × Spec)
        </span>
        <span className="text-[11px]" style={{ color: "var(--v-spec)" }}>
          Viền đứt màu cam = Cặp mô hình cùng họ (Homogeneous)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-collapse border" style={{ borderColor: "var(--rule)" }}>
          <thead>
            <tr className="border-b" style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)" }}>
              <th className="p-2 border-r text-left" style={{ borderColor: "var(--rule)" }}>Coder \ Spec</th>
              {models.map((m, i) => (
                <th key={i} className="p-2 border-r text-center" style={{ borderColor: "var(--rule)" }}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((coder, cIdx) => (
              <tr key={cIdx} className="border-b" style={{ borderColor: "var(--rule)" }}>
                <td className="p-2 border-r font-bold" style={{ borderColor: "var(--rule)" }}>{coder}</td>
                {models.map((spec, sIdx) => {
                  const cell = data.cells.find((c) => c.coder === coder && c.spec === spec);
                  const rate = cell?.silentFaultRate ?? 0;
                  const isHomogeneous = cell?.isHomogeneous;

                  return (
                    <td
                      key={sIdx}
                      data-testid={`correlation-cell-${cIdx}-${sIdx}`}
                      onClick={() => onSelectWitnesses(cell?.witnesses ?? [])}
                      className="p-3 border-r text-center cursor-pointer font-bold transition-all hover:scale-105"
                      style={{
                        borderColor: isHomogeneous ? "var(--v-spec)" : "var(--rule)",
                        borderWidth: isHomogeneous ? "2px" : "1px",
                        backgroundColor: isHomogeneous ? "rgba(184, 120, 10, 0.15)" : "transparent",
                        color: isHomogeneous ? "var(--v-spec)" : "var(--ink)",
                      }}
                    >
                      {rate.toFixed(1)}%
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── RQ5: 5a–5d Repair Metrics Suite & UNKNOWN_GATE Breakdown ──────────────────
export function RQ5Chart({ data, onSelectWitnesses }: ChartProps<"rq5">) {
  return (
    <div data-testid="rq5-chart" className="flex flex-col gap-5 font-mono text-xs">
      {/* 4-chart suite cards (5a-5d) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {data.suite.map((metric) => (
          <div
            key={metric.key}
            data-testid={`rq5-metric-${metric.key}`}
            onClick={() => onSelectWitnesses(metric.witnesses)}
            className="p-3 rounded border cursor-pointer hover:border-[var(--action)] transition-all flex flex-col gap-1.5"
            style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)" }}
          >
            <span className="font-semibold text-xs" style={{ color: "var(--ink)" }}>{metric.title}</span>
            <div className="text-xl font-bold" style={{ color: "var(--action)" }}>{metric.value}</div>
            <div className="text-[11px]" style={{ color: "var(--ink-soft)" }}>{metric.interpretation}</div>
          </div>
        ))}
      </div>

      {/* UNKNOWN_GATE Decomposition */}
      <div
        className="p-3 rounded border flex flex-col gap-2.5"
        style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--rule)" }}
      >
        <span className="font-semibold" style={{ color: "var(--ink)" }}>
          Phân rã Nguyên nhân UNKNOWN_GATE (Pipeline G1–G5)
        </span>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {data.unknownGateBreakdown.map((item) => (
            <div
              key={item.check}
              data-testid={`unknown-gate-breakdown-${item.check}`}
              onClick={() => onSelectWitnesses(item.witnesses)}
              className="p-2.5 rounded border cursor-pointer hover:border-[var(--action)] flex flex-col gap-1"
              style={{
                backgroundColor: "var(--paper-ground)",
                borderColor: item.check === "G4" ? "var(--v-spec)" : "var(--rule)",
                borderStyle: item.check === "G4" ? "dashed" : "solid",
              }}
            >
              <div className="flex justify-between">
                <span className="font-bold">{item.check}</span>
                <span className="font-semibold" style={{ color: "var(--action)" }}>{item.percentage}%</span>
              </div>
              <div className="text-[11px] font-semibold">{item.name}</div>
              <div className="text-[10px]" style={{ color: "var(--ink-soft)" }}>{item.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── RQ6: Risk-Coverage-Query Trade-off Pareto ────────────────────────────────
export function RQ6Chart({ data, onSelectWitnesses }: ChartProps<"rq6">) {
  return (
    <div data-testid="rq6-chart" className="flex flex-col gap-4 font-mono text-xs">
      <span className="font-semibold" style={{ color: "var(--ink)" }}>
        So sánh Hiệu quả Can thiệp Con người (Risk-Coverage-Query Pareto)
      </span>

      <div
        className="p-3 rounded border flex flex-col gap-2"
        style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)" }}
      >
        <svg viewBox="0 0 500 160" className="w-full h-44">
          <line x1="40" y1="10" x2="40" y2="130" stroke="var(--rule)" strokeWidth="1.5" />
          <line x1="40" y1="130" x2="480" y2="130" stroke="var(--rule)" strokeWidth="1.5" />
          <text x="5" y="20" fill="var(--ink-soft)" fontSize="9">Residual Risk</text>
          <text x="440" y="145" fill="var(--ink-soft)" fontSize="9">Số câu hỏi (q)</text>

          {data.strategies.map((strat, sIdx) => {
            const color =
              strat.id === "active_adjudicated"
                ? "var(--action)"
                : strat.id === "random_query"
                ? "var(--v-spec)"
                : "var(--ink-soft)";

            return (
              <g key={strat.id}>
                {strat.points.map((pt, i) => {
                  const cx = 40 + (pt.queriesCount / 164) * 420;
                  const cy = 130 - (pt.residualRisk / 5) * 110;
                  const prev = strat.points[i - 1];
                  const prevX = prev ? 40 + (prev.queriesCount / 164) * 420 : cx;
                  const prevY = prev ? 130 - (prev.residualRisk / 5) * 110 : cy;

                  return (
                    <g key={i}>
                      {prev && (
                        <line
                          x1={prevX}
                          y1={prevY}
                          x2={cx}
                          y2={cy}
                          stroke={color}
                          strokeWidth="2"
                          strokeDasharray={strat.id === "random_query" ? "4,4" : undefined}
                        />
                      )}
                      <circle
                        data-testid={`rq6-point-${strat.id}-${i}`}
                        cx={cx}
                        cy={cy}
                        r="4.5"
                        fill={color}
                        stroke="var(--paper-surface)"
                        strokeWidth="1"
                        className="cursor-pointer hover:r-6 transition-all"
                        onClick={() => onSelectWitnesses(pt.witnesses)}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--action)" }} />
            <span>Hỏi chủ động theo Phân xử (Proposed)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--v-spec)" }} />
            <span>Hỏi ngẫu nhiên (Random Query Baseline)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--ink-soft)" }} />
            <span>Hỏi toàn bộ (Full Query Baseline)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
