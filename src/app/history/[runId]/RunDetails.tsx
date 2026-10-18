"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Run } from "@/core/evaluation-types";

export default function RunDetails({ runId }: { runId: string }) {
  const [run, setRun] = useState<Run>();
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { fetch(`/api/runs/${runId}`).then((r) => r.json()).then((d) => { setRun(d.run); setNote(d.run?.review?.note ?? ""); }); }, [runId]);
  const review = async (agree: boolean) => {
    const res = await fetch(`/api/runs/${runId}/review`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agree, note }) });
    const data = await res.json(); setRun(data.run); setMessage(res.ok ? "Đã lưu đánh giá." : data.error);
  };
  if (!run) return <main className="eval-page">Đang tải phiên…</main>;
  return <main className="eval-page"><nav className="eval-nav"><Link href="/">Kiểm thử</Link><Link href="/history">Lịch sử</Link><Link href="/stats">Thống kê</Link></nav><header className="eval-header"><div><h1>Chi tiết phiên</h1><p className="mono">{run.run_id}</p></div><span>{run.dataset.id} · {run.dataset.version}</span></header><section className="detail-section"><h2>Đề bài · {run.problem_id}</h2><pre>{run.problem}</pre></section>{run.spec && <section className="detail-section"><h2>Đầu ra đặc tả · {run.spec.agent}</h2><pre>{run.spec.output ?? "Chưa có dữ liệu agent."}</pre></section>}{run.code && <section className="detail-section"><h2>Đầu ra mã · {run.code.agent}</h2><pre>{run.code.output ?? "Chưa có dữ liệu agent."}</pre></section>}<section className="detail-section"><h2>Hội thoại và verdict từng lượt</h2>{run.turns.map((turn) => <article className="detail-turn" key={turn.id}><small>{turn.role} · {new Date(turn.at).toLocaleString("vi-VN")}</small><p>{turn.content}</p>{turn.verdict && <strong className="mono">{turn.verdict}</strong>}</article>)}</section><section className="detail-section"><h2>Nhật ký</h2>{run.logs?.map((entry) => <div className="detail-log mono" key={entry.id}>{entry.at} [{entry.level}] {entry.message}</div>) ?? <p>Không có log được ghi.</p>}</section><section className="detail-section"><h2>Đánh giá của người kiểm định</h2><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú đánh giá" /><div className="eval-actions"><button className="eval-button" onClick={() => void review(true)}>Đồng ý với verdict</button><button className="eval-button" onClick={() => void review(false)}>Không đồng ý</button></div><p role="status">{message}</p></section></main>;
}
