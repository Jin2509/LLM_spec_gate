/**
 * Câu trả lời của hệ thống cho một yêu cầu: tiến trình 3 bước (đặc tả, code, đối chiếu) và kết luận.
 * Kết luận là giá trị backend trả về; ở đây chỉ ánh xạ sang nhãn và màu.
 */
"use client";

import { CircleAlert, CircleCheck, CircleDashed, LoaderCircle } from "lucide-react";
import React from "react";
import type { ChatStepId, ChatVerdict } from "@/lib/api";
import { i18n } from "@/i18n/vi";
import { Notice, TechDetails, toneStyle, type Tone } from "@/ui/layout";
import type { ChatRunState, ChatStep } from "../use-chat-run";

const t = i18n.chat;
const STEP_ORDER: readonly ChatStepId[] = ["spec", "code", "check"];

const VERDICT_TONE: Record<ChatVerdict, Tone> = {
  consistent: "success",
  spec_fault: "warning",
  code_fault: "danger",
  unknown: "neutral",
};

function StepIcon({ status }: { status: ChatStep["status"] | "pending" }) {
  if (status === "running") return <LoaderCircle size={16} className="animate-spin" aria-hidden="true" style={{ color: "var(--accent)" }} />;
  if (status === "done") return <CircleCheck size={16} aria-hidden="true" style={{ color: "var(--v-acc)" }} />;
  if (status === "error") return <CircleAlert size={16} aria-hidden="true" style={{ color: "var(--v-code)" }} />;
  return <CircleDashed size={16} aria-hidden="true" style={{ color: "var(--text-muted)" }} />;
}

/** Bỏ hàng rào ```lang ... ``` bao quanh code khi hiển thị (chỉ đổi cách hiện, không đổi dữ liệu). */
function stripFence(text: string): string {
  const match = text.trim().match(/^```[\w-]*\n([\s\S]*?)\n?```$/);
  return match ? match[1]! : text;
}

function StepRow({ id, step, active }: { id: ChatStepId; step?: ChatStep; active: boolean }) {
  const status = step?.status ?? "pending";
  const copy = t.steps[id];
  // Bước đối chiếu trả JSON thô: chỉ để trong "Chi tiết kỹ thuật"; đặc tả và code hiện rõ cho người đọc.
  const raw = step?.status === "done" ? step.output : undefined;
  const output = raw !== undefined && id === "code" ? stripFence(raw) : raw;

  return (
    <li data-testid={`chat-step-${id}`} data-status={status} className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5 text-[13.5px]">
        <StepIcon status={status} />
        <span className="font-medium" style={{ color: status === "pending" ? "var(--ink-soft)" : "var(--ink)" }}>
          {copy.title}
        </span>
        {status === "running" && active && <span style={{ color: "var(--ink-soft)" }}>{copy.running}</span>}
        {step?.durationMs !== undefined && (
          <span className="ml-auto text-[12px] tabular-nums" style={{ color: "var(--ink-soft)" }}>
            {(step.durationMs / 1000).toFixed(1)} s
          </span>
        )}
      </div>
      {output !== undefined &&
        (id === "check" ? (
          <div className="pl-6">
            <TechDetails>
              <pre className="m-0 text-[12px] whitespace-pre-wrap break-words font-mono" style={{ color: "var(--text-secondary)" }}>
                {output}
              </pre>
            </TechDetails>
          </div>
        ) : (
          <pre
            className={`m-0 ml-6 px-3.5 py-3 rounded-[var(--radius-md)] text-[13px] leading-relaxed whitespace-pre-wrap break-words max-h-[420px] overflow-auto ${
              id === "code" ? "font-mono text-[12.5px]" : "font-sans"
            }`}
            style={{ backgroundColor: "var(--bg-sunken)", color: "var(--ink)" }}
          >
            {output}
          </pre>
        ))}
    </li>
  );
}

export function ChatReply({ state }: { state: ChatRunState }) {
  const running = state.phase === "running";
  const lastId = state.steps.at(-1)?.id;

  return (
    <div className="flex flex-col gap-4" aria-live="polite" aria-busy={running}>
      <ol className="m-0 p-0 list-none flex flex-col gap-3">
        {STEP_ORDER.map((id) => (
          <StepRow key={id} id={id} step={state.steps.find((s) => s.id === id)} active={id === lastId} />
        ))}
      </ol>

      {state.verdict && (
        <div
          data-testid="chat-verdict"
          data-verdict={state.verdict.verdict}
          className="flex flex-col gap-1 px-4 py-3 rounded-[var(--radius-md)] border"
          style={toneStyle(VERDICT_TONE[state.verdict.verdict])}
        >
          <span className="text-[12px] font-medium uppercase tracking-[0.06em] opacity-80">{t.conclusion}</span>
          <span className="text-[15px] font-semibold">{t.verdicts[state.verdict.verdict]}</span>
          {state.verdict.reason && (
            <span className="text-[13.5px] leading-relaxed" style={{ color: "var(--ink)" }}>
              {state.verdict.reason}
            </span>
          )}
        </div>
      )}

      {state.phase === "error" && state.error && (
        <div data-testid="chat-error">
          <Notice tone="danger">{state.error}</Notice>
        </div>
      )}
      {state.phase === "stopped" && <Notice>{t.stopped}</Notice>}
    </div>
  );
}
