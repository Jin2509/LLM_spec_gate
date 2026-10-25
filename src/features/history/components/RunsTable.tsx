import React from "react";
import Link from "next/link";
import type { Run } from "@/core/evaluation-types";

function goldComparison(run: Run): string {
  if (!run.gold_label) return "—";
  return run.gold_label === run.verdicts.at(-1) ? "Khớp" : "Lệch";
}

export function RunsTable({ runs }: { runs: readonly Run[] }) {
  return (
    <div className="eval-table-wrap">
      <table className="eval-table">
        <thead>
          <tr>
            <th>Run ID</th>
            <th>Thời điểm</th>
            <th>Dataset</th>
            <th>Mã đề</th>
            <th>Verdict</th>
            <th>So với nhãn</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.run_id}>
              <td>
                <Link href={`/history/${run.run_id}`} className="mono">
                  {run.run_id.slice(0, 12)}
                </Link>
              </td>
              <td>{new Date(run.created_at).toLocaleString("vi-VN")}</td>
              <td>{run.dataset.id}</td>
              <td>{run.problem_id}</td>
              <td className="mono">{String(run.verdicts.at(-1) ?? "—")}</td>
              <td>{goldComparison(run)}</td>
              <td>{run.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!runs.length && <p className="empty-data">Chưa có phiên chạy được lưu.</p>}
    </div>
  );
}
