import React from "react";
import type { Run } from "@/core/evaluation-types";

export function DetailSection({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="detail-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function RunOutputs({ run }: { run: Run }) {
  return (
    <>
      <DetailSection title={`Đề bài · ${run.problem_id}`}>
        <pre>{run.problem}</pre>
      </DetailSection>
      {run.spec && (
        <DetailSection title={`Đầu ra đặc tả · ${run.spec.agent}`}>
          <pre>{run.spec.output ?? "Chưa có dữ liệu agent."}</pre>
        </DetailSection>
      )}
      {run.code && (
        <DetailSection title={`Đầu ra mã · ${run.code.agent}`}>
          <pre>{run.code.output ?? "Chưa có dữ liệu agent."}</pre>
        </DetailSection>
      )}
    </>
  );
}

export function RunTurns({ run }: { run: Run }) {
  return (
    <DetailSection title="Hội thoại và verdict từng lượt">
      {run.turns.map((turn) => (
        <article className="detail-turn" key={turn.id}>
          <small>
            {turn.role} · {new Date(turn.at).toLocaleString("vi-VN")}
          </small>
          <p>{turn.content}</p>
          {turn.verdict && <strong className="mono">{turn.verdict}</strong>}
        </article>
      ))}
    </DetailSection>
  );
}

export function RunLogs({ run }: { run: Run }) {
  return (
    <DetailSection title="Nhật ký">
      {run.logs?.length ? (
        run.logs.map((entry) => (
          <div className="detail-log mono" key={entry.id}>
            {entry.at} [{entry.level}] {entry.message}
          </div>
        ))
      ) : (
        <p>Không có log được ghi.</p>
      )}
    </DetailSection>
  );
}
