/**
 * src/features/chat/ChatScreen.tsx — Trang hỏi đáp duy nhất của SpecGate.
 *
 * Người dùng chọn dataset + tác vụ cho mô hình rồi chạy; backend sinh đặc tả bằng LLM đặc tả, sinh code
 * bằng LLM code, đối chiếu và trả kết luận. Chỉ khi backend chưa kết luận được (gửi kèm câu hỏi) thì
 * trang mới mở ô trả lời, và chỉ cho trả lời đúng một lần.
 */
"use client";

import { Play, RotateCcw } from "lucide-react";
import React, { useState } from "react";
import type { ChatStepId } from "@/lib/api";
import { i18n } from "@/i18n/vi";
import { AppShell } from "@/ui/shell/AppShell";
import { Button } from "@/ui/primitives/Button";
import { Notice } from "@/ui/layout";
import { SpecGateLogo } from "@/ui/shell/SpecGateLogo";
import { ChatComposer } from "./components/ChatComposer";
import { ChatReply } from "./components/ChatReply";
import { DatasetPicker, type DatasetSelection } from "./components/DatasetPicker";
import { LlmConfigPanel } from "./components/LlmConfigPanel";
import { useLlmConfig } from "./llm-config";
import { useChatRun } from "./use-chat-run";

const t = i18n.chat;
const FIRST_STEPS: readonly ChatStepId[] = ["spec", "code", "check"];
const FOLLOWUP_STEPS: readonly ChatStepId[] = ["check"];

function Bubble({ who, children }: { who: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold" style={{ color: "var(--ink-soft)" }}>
        {who}
      </span>
      {children}
    </div>
  );
}

function UserText({ testId, children }: { testId: string; children: React.ReactNode }) {
  return (
    <div
      data-testid={testId}
      className="self-start max-w-full px-4 py-3 rounded-[var(--radius-lg)] text-[14px] leading-relaxed whitespace-pre-wrap break-words"
      style={{ backgroundColor: "var(--accent-soft)", color: "var(--ink)" }}
    >
      {children}
    </div>
  );
}

export function ChatScreen() {
  const { configs, ready } = useLlmConfig();
  const { state, start, answer, stop, reset } = useChatRun();
  const [selection, setSelection] = useState<DatasetSelection>();
  const [draft, setDraft] = useState("");
  const started = state.phase !== "idle";
  const running = state.phase === "running";
  const question = state.first.verdict?.question;
  const blockedReason = !ready ? t.needKeys : !selection ? t.needTask : undefined;

  const run = () => {
    if (blockedReason || !selection) return;
    const { datasetId, task } = selection;
    void start(
      { llmSpec: configs.spec, llmCode: configs.code, datasetId, taskId: task.id },
      { datasetId, taskId: task.id, title: task.name, intent: task.intentDocstring },
    );
  };

  const submitAnswer = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    void answer(text, configs.spec);
  };

  return (
    <AppShell fullBleed>
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 flex flex-col">
        <div className="flex-1 flex flex-col gap-6 py-6 md:py-10">
          {!started ? (
            <div className="flex flex-col items-center text-center gap-3 pt-4 md:pt-8">
              <SpecGateLogo size={44} />
              <h1 className="m-0 text-[24px] md:text-[28px] font-semibold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
                {t.title}
              </h1>
              <p className="m-0 max-w-xl text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {t.subtitle}
              </p>
              <div className="w-full mt-6 flex flex-col gap-3 text-left">
                <LlmConfigPanel />
                <DatasetPicker value={selection} onChange={setSelection} />
              </div>
            </div>
          ) : (
            <>
              <Bubble who={t.task}>
                <UserText testId="chat-task">
                  <strong>{state.task?.title}</strong>
                  {"\n"}
                  {state.task?.intent}
                </UserText>
              </Bubble>
              <Bubble who={t.system}>
                <ChatReply round={state.first} stepIds={FIRST_STEPS} running={running && !state.followup} />
              </Bubble>

              {question && (
                <Bubble who={t.system}>
                  <div data-testid="chat-question">
                    <Notice tone="info">{question}</Notice>
                  </div>
                </Bubble>
              )}
              {state.answer !== undefined && (
                <Bubble who={t.you}>
                  <UserText testId="chat-answer">{state.answer}</UserText>
                </Bubble>
              )}
              {state.followup && (
                <Bubble who={t.followupTitle}>
                  <ChatReply round={state.followup} stepIds={FOLLOWUP_STEPS} running={running} testIdPrefix="chat-followup" />
                </Bubble>
              )}

              {state.phase === "error" && state.error && (
                <div data-testid="chat-error">
                  <Notice tone="danger">{state.error}</Notice>
                </div>
              )}
              {state.phase === "stopped" && <Notice>{t.stopped}</Notice>}
            </>
          )}
        </div>

        <div className="sticky bottom-0 pb-4 pt-2 flex flex-col gap-3" style={{ backgroundColor: "var(--bg-app)" }}>
          {!started ? (
            <div className="flex flex-wrap items-center justify-end gap-3 py-2">
              {blockedReason && (
                <span className="mr-auto text-[12.5px]" style={{ color: "var(--v-spec)" }}>
                  {blockedReason}
                </span>
              )}
              <Button onClick={run} disabled={!!blockedReason} data-testid="chat-run">
                <Play size={15} aria-hidden="true" />
                {t.run}
              </Button>
            </div>
          ) : state.phase === "asking" || (running && state.followup) ? (
            <ChatComposer value={draft} onChange={setDraft} onSubmit={submitAnswer} onStop={stop} running={running} />
          ) : running ? (
            <div className="flex justify-end py-2">
              <Button variant="secondary" onClick={stop}>
                {t.stop}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 py-2">
              <span className="text-[13px]" style={{ color: "var(--ink-soft)" }}>
                {state.phase === "done" ? t.done : ""}
              </span>
              <Button onClick={reset} data-testid="chat-new">
                <RotateCcw size={15} aria-hidden="true" />
                {t.newRequest}
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
