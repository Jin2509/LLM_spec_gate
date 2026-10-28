"use client";

import React from "react";
import Link from "next/link";
import type { Metrics, Run } from "@/core/evaluation-types";
import { VERDICT_CLASSES } from "../derive";

/** Nhãn hiển thị cho nhóm verdict; khoá dữ liệu giữ nguyên mã gốc. */
export const VERDICT_CLASS_LABELS: Record<(typeof VERDICT_CLASSES)[number], string> = {
  ACC: "Đặc tả và code khớp",
  CODE_FAULT: "Lỗi code",
  SPEC_FAULT: "Lỗi đặc tả",
  UNKNOWN: "Chưa kết luận",
};

export function StatCard({ title, children, table }: { title: string; children: React.ReactNode; table?: React.ReactNode }) {
  return (
    <section className="stat-card">
      <h2>{title}</h2>
      {children}
      {table && (
        <details>
          <summary>Xem dạng bảng</summary>
          {table}
        </details>
      )}
    </section>
  );
}

/** Màu theo nhóm verdict (token OKLCH trong tokens.css). */
const VERDICT_CLASS_COLORS: Record<(typeof VERDICT_CLASSES)[number], string> = {
  ACC: "var(--v-acc)",
  CODE_FAULT: "var(--v-code)",
  SPEC_FAULT: "var(--v-spec)",
  UNKNOWN: "var(--v-unknown)",
};

export function BarChartCard({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const max = Math.max(0, ...rows.map((r) => r.value));
  return (
    <StatCard
      title={title}
      table={
        <table className="eval-table">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th>{r.label}</th>
                <td>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <div role="img" aria-label={title}>
        {rows.map((row) => (
          <div className="bar-row" key={row.label}>
            <span>{row.label}</span>
            <div className="bar-track" tabIndex={0} aria-label={`${row.label}: ${row.value}`}>
              <div className="bar-fill" style={{ width: `${max ? Math.max(1, (row.value / max) * 100) : 0}%` }} />
            </div>
            <b className="mono">{row.value}</b>
          </div>
        ))}
      </div>
    </StatCard>
  );
}

/** Biểu đồ tròn tỷ lệ verdict (conic-gradient, không cần thư viện); bảng số liệu nằm trong "Xem dạng bảng". */
export function VerdictPieCard({ rows }: { rows: Array<{ key: (typeof VERDICT_CLASSES)[number]; value: number }> }) {
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const present = rows.filter((r) => r.value > 0);
  const stops = present.map((r, i) => {
    const before = present.slice(0, i).reduce((sum, x) => sum + x.value, 0);
    const start = (before / total) * 100;
    const end = ((before + r.value) / total) * 100;
    return `${VERDICT_CLASS_COLORS[r.key]} ${start}% ${end}%`;
  });
  const share = (n: number) => (total ? `${((n / total) * 100).toFixed(1)}%` : "0%");
  return (
    <StatCard
      title="Tỷ lệ phán quyết"
      table={
        <table className="eval-table">
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th>{VERDICT_CLASS_LABELS[r.key]}</th>
                <td>{r.value}</td>
                <td>{share(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      {total === 0 ? (
        <p>Chưa có phiên nào có kết luận.</p>
      ) : (
        <div className="pie-wrap" data-testid="verdict-pie">
          <div
            className="pie"
            role="img"
            aria-label={rows.map((r) => `${VERDICT_CLASS_LABELS[r.key]}: ${r.value} (${share(r.value)})`).join(", ")}
            style={{ background: `conic-gradient(${stops.join(", ")})` }}
          />
          <ul className="pie-legend">
            {rows.map((r) => (
              <li key={r.key}>
                <span className="pie-swatch" style={{ background: VERDICT_CLASS_COLORS[r.key] }} aria-hidden="true" />
                <span>{VERDICT_CLASS_LABELS[r.key]}</span>
                <b className="mono">
                  {r.value} · {share(r.value)}
                </b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </StatCard>
  );
}

const pct = (value: number | undefined) => (value == null ? "—" : `${(value * 100).toFixed(1)}%`);

export function MetricGrid({ metrics }: { metrics?: Metrics }) {
  const tiles: Array<[string, React.ReactNode]> = [
    ["Tổng số phiên", metrics?.totalRuns],
    ...VERDICT_CLASSES.map((x): [string, React.ReactNode] => [VERDICT_CLASS_LABELS[x], metrics?.byVerdict[x]]),
    ["Độ chính xác", pct(metrics?.accuracy)],
    ["Độ tin cậy trung bình", metrics?.averageConfidence == null ? "—" : metrics.averageConfidence.toFixed(3)],
    [
      "Latency TB / p50 / p95",
      [metrics?.latency.mean, metrics?.latency.p50, metrics?.latency.p95].map((v) => (v == null ? "—" : `${v.toFixed(0)} ms`)).join(" / "),
    ],
    ["Lượt bổ sung", metrics?.followupsUsed],
    ["Ca chưa kết luận được giải quyết", pct(metrics?.unknownResolvedRate)],
  ];
  return (
    <div className="metric-grid">
      {tiles.map(([label, value]) => (
        <section className="metric-card" key={label}>
          <span>{label}</span>
          <strong className="mono">{value ?? 0}</strong>
        </section>
      ))}
    </div>
  );
}

export function ProblemBreakdownCard({ rows }: { rows: Array<[string, Record<string, number>]> }) {
  return (
    <StatCard title="Tỷ lệ theo đề bài" table={<pre>{JSON.stringify(rows, null, 2)}</pre>}>
      {rows.map(([id, values]) => (
        <div className="stack-row" key={id}>
          <span>{id}</span>
          {VERDICT_CLASSES.map((c) => (
            <span key={c} style={{ flex: values[c] ?? 0, borderBottom: `3px ${c === "UNKNOWN" ? "dashed" : "solid"} var(--accent)` }}>
              {c}: {values[c] ?? 0}
            </span>
          ))}
        </div>
      ))}
    </StatCard>
  );
}

export function ConfusionMatrixCard({ matrix, totalRuns }: { matrix: number[][]; totalRuns: number }) {
  return (
    <StatCard
      title="Ma trận nhầm lẫn · nhãn đúng × verdict"
      table={<p>Precision, recall, F1 cần nhãn đúng cho mỗi run; được tính khi dữ liệu nhãn đã có.</p>}
    >
      <table className="eval-table">
        <thead>
          <tr>
            <th>Nhãn đúng</th>
            {VERDICT_CLASSES.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VERDICT_CLASSES.map((c, i) => (
            <tr key={c}>
              <th>{c}</th>
              {matrix[i]?.map((n, j) => (
                <td key={j}>
                  {n} · {totalRuns ? ((n / totalRuns) * 100).toFixed(1) : "0.0"}%
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </StatCard>
  );
}

export function DailyRunsCard({ rows }: { rows: Array<[string, { total: number; unknown: number }]> }) {
  return (
    <StatCard title="Số run theo ngày · tỷ lệ UNKNOWN" table={<pre>{JSON.stringify(rows, null, 2)}</pre>}>
      {rows.map(([day, value]) => (
        <div className="bar-row" key={day}>
          <span>{day}</span>
          <span>
            {value.total} run · UNKNOWN {value.total ? ((value.unknown / value.total) * 100).toFixed(1) : 0}%
          </span>
        </div>
      ))}
    </StatCard>
  );
}

export function ModelPairsCard({ rows }: { rows: Array<{ pair: string; total: number; unknown: number }> }) {
  return (
    <StatCard title="So sánh phiên bản agent/model" table={<pre>{JSON.stringify(rows, null, 2)}</pre>}>
      {rows.length ? (
        rows.map((row) => (
          <div className="bar-row" key={row.pair}>
            <span>{row.pair}</span>
            <span>
              {row.total} run · UNKNOWN {row.total ? ((row.unknown / row.total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        ))
      ) : (
        <p>Chưa có run nào mang metadata model để so sánh.</p>
      )}
    </StatCard>
  );
}

export function RawMetricsCard({ raw }: { raw: string }) {
  return (
    <StatCard title="Số liệu thô">
      <pre>{raw}</pre>
      <button className="eval-button" onClick={() => void navigator.clipboard?.writeText(raw)}>
        Sao chép dạng văn bản
      </button>
    </StatCard>
  );
}

export function ReviewQueueCard({ runs }: { runs: readonly Run[] }) {
  return (
    <StatCard title="Ca lỗi cần xem">
      {runs.length ? (
        runs.map((run) => (
          <p key={run.run_id}>
            <Link href={`/history/${run.run_id}`}>
              {run.problem_id} · {run.verdicts.at(-1) ?? "UNKNOWN"} · {run.run_id}
            </Link>
          </p>
        ))
      ) : (
        <p>Chưa có ca cần xem.</p>
      )}
    </StatCard>
  );
}
