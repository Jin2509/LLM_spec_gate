"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Run } from "@/core/evaluation-types";

export default function HistoryPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [verdict, setVerdict] = useState("");
  const [problem, setProblem] = useState("");
  const [dataset, setDataset] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const load = useCallback(async () => {
    const query = new URLSearchParams({ page: String(page), pageSize: "25" });
    if (verdict) query.set("verdict", verdict);
    if (problem) query.set("problem", problem);
    if (dataset) query.set("dataset", dataset);
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    const response = await fetch(`/api/runs?${query}`);
    const data = await response.json();
    setRuns(data.runs ?? []); setTotal(data.total ?? 0);
  }, [page, verdict, problem, dataset, from, to]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  const clear = async () => {
    const confirmation = window.prompt("Để xóa lịch sử, nhập chính xác: XOA LICH SU");
    if (confirmation !== "XOA LICH SU") return;
    await fetch("/api/runs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation }) });
    setPage(1); await load();
  };
  return <main className="eval-page"><nav className="eval-nav"><Link href="/">Kiểm thử</Link><Link aria-current="page" href="/history">Lịch sử</Link><Link href="/stats">Thống kê</Link></nav><header className="eval-header"><div><h1>Lịch sử phiên chạy</h1><p>{total} bản ghi · lưu trong JSONL phía máy chủ</p></div><div className="eval-actions"><Link className="eval-button" href="/api/runs/export?format=csv">Xuất CSV</Link><Link className="eval-button" href="/api/runs/export?format=json">Xuất JSON</Link><Link className="eval-button" href="/api/runs/export?format=stats">Xuất thống kê</Link><button className="eval-button" onClick={() => void clear()}>Xóa lịch sử</button></div></header>
    <section className="eval-filters"><input aria-label="Tìm đề bài" placeholder="Đề bài / mã đề" value={problem} onChange={(e) => { setProblem(e.target.value); setPage(1); }} /><select aria-label="Lọc verdict" value={verdict} onChange={(e) => { setVerdict(e.target.value); setPage(1); }}><option value="">Mọi verdict</option><option>CODE_FAULT</option><option>SPEC_FAULT</option><option>UNKNOWN</option></select><input aria-label="Dataset" placeholder="Dataset" value={dataset} onChange={(e) => { setDataset(e.target.value); setPage(1); }} /><label>Từ <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label>Đến <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label></section>
    <div className="eval-table-wrap"><table className="eval-table"><thead><tr><th>Run ID</th><th>Thời điểm</th><th>Dataset</th><th>Mã đề</th><th>Verdict</th><th>So với nhãn</th><th>Trạng thái</th></tr></thead><tbody>{runs.map((run) => <tr key={run.run_id}><td><Link href={`/history/${run.run_id}`} className="mono">{run.run_id.slice(0, 12)}</Link></td><td>{new Date(run.created_at).toLocaleString("vi-VN")}</td><td>{run.dataset.id}</td><td>{run.problem_id}</td><td className="mono">{String(run.verdicts.at(-1) ?? "—")}</td><td>{run.gold_label ? (run.gold_label === run.verdicts.at(-1) ? "Khớp" : "Lệch") : "—"}</td><td>{run.status}</td></tr>)}</tbody></table>{!runs.length && <p className="empty-data">Chưa có phiên chạy được lưu.</p>}</div>
    <div className="eval-pagination"><button className="eval-button" disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>Trang trước</button><span>Trang {page} / {Math.max(1, Math.ceil(total / 25))}</span><button className="eval-button" disabled={page * 25 >= total} onClick={() => setPage((n) => n + 1)}>Trang sau</button></div>
  </main>;
}
