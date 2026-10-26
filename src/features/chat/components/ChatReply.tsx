/**
 * Một vòng trả lời của hệ thống: tiến trình các bước (đặc tả, code, đối chiếu) và kết luận.
 * Kết luận là giá trị backend trả về; ở đây chỉ ánh xạ sang nhãn và màu.
 */
"use client";

import { CircleAlert, CircleCheck, CircleDashed, LoaderCircle } from "lucide-react";
import React from "react";
import type { ChatStepId, ChatVerdict } from "@/lib/api";
import { i18n } from "@/i18n/vi";
import { TechDetails, toneStyle, type Tone } from "@/ui/layout";
import type { ChatRound, ChatStep } from "../use-chat-run";

const t = i18n.chat;

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

function StepRow({ id, step, active, testIdPrefix }: { id: ChatStepId; step?: ChatStep; active: boolean; testIdPrefix: string }) {
  const status = step?.status ?? "pending";
  const copy = t.steps[id];
  // Bước đối chiếu trả JSON thô: chỉ để trong "Chi tiết kỹ thuật"; đặc tả và code hiện rõ cho người đọc.
  const raw = step?.status === "done" ? step.output : undefined;
  const output = raw !== undefined && id === "code" ? stripFence(raw) : raw;

  return (
    <li data-testid={`${testIdPrefix}-${id}`} data-status={status} className="flex flex-col gap-2">
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

export interface ChatReplyProps {
  round: ChatRound;
  /** Các bước của vòng này theo thứ tự hiển thị (vòng hỏi lại chỉ có "check"). */
  stepIds: readonly ChatStepId[];
  running: boolean;
  testIdPrefix?: string;
}

export function ChatReply({ round, stepIds, running, testIdPrefix = "chat-step" }: ChatReplyProps) {
  const lastId = round.steps.at(-1)?.id;

  return (
    <div className="flex flex-col gap-4" aria-live="polite" aria-busy={running}>
      <ol className="m-0 p-0 list-none flex flex-col gap-3">
        {stepIds.map((id) => (
          <StepRow key={id} id={id} step={round.steps.find((s) => s.id === id)} active={id === lastId} testIdPrefix={testIdPrefix} />
        ))}
      </ol>

      {round.verdict && (
        <div
          data-testid={`${testIdPrefix}-verdict`}
          data-verdict={round.verdict.verdict}
          className="flex flex-col gap-1 px-4 py-3 rounded-[var(--radius-md)] border"
          style={toneStyle(VERDICT_TONE[round.verdict.verdict])}
        >
          <span className="text-[12px] font-medium uppercase tracking-[0.06em] opacity-80">{t.conclusion}</span>
          <span className="text-[15px] font-semibold">{t.verdicts[round.verdict.verdict]}</span>
          {round.verdict.reason && (
            <span className="text-[13.5px] leading-relaxed" style={{ color: "var(--ink)" }}>
              {round.verdict.reason}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
