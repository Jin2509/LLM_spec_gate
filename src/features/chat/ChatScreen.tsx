/**
 * src/features/chat/ChatScreen.tsx — Trang hỏi đáp duy nhất của SpecGate.
 *
 * Người dùng mô tả yêu cầu MỘT lần; hệ thống (backend) sinh đặc tả bằng LLM đặc tả, sinh code bằng
 * LLM code, đối chiếu rồi trả kết luận. Muốn hỏi tiếp thì bắt đầu "Yêu cầu mới".
 */
"use client";

import { RotateCcw } from "lucide-react";
import React, { useState } from "react";
import { i18n } from "@/i18n/vi";
import { AppShell } from "@/ui/shell/AppShell";
import { Button } from "@/ui/primitives/Button";
import { SpecGateLogo } from "@/ui/shell/SpecGateLogo";
import { ChatComposer } from "./components/ChatComposer";
import { ChatReply } from "./components/ChatReply";
import { LlmConfigPanel } from "./components/LlmConfigPanel";
import { useLlmConfig } from "./llm-config";
import { useChatRun } from "./use-chat-run";

const t = i18n.chat;

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

export function ChatScreen() {
  const { configs, ready } = useLlmConfig();
  const { state, send, stop, reset } = useChatRun();
  const [draft, setDraft] = useState("");
  const started = state.phase !== "idle";
  const running = state.phase === "running";

  const submit = () => {
    const intent = draft.trim();
    if (!intent || !ready) return;
    setDraft("");
    void send({ intent, llmSpec: configs.spec, llmCode: configs.code });
  };

  return (
    <AppShell fullBleed>
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 flex flex-col">
        <div className="flex-1 flex flex-col gap-6 py-6 md:py-10">
          {!started ? (
            <div className="flex flex-col items-center text-center gap-3 pt-4 md:pt-10">
              <SpecGateLogo size={44} />
              <h1 className="m-0 text-[24px] md:text-[28px] font-semibold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
                {t.title}
              </h1>
              <p className="m-0 max-w-xl text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {t.subtitle}
              </p>
              <div className="w-full mt-6 text-left">
                <LlmConfigPanel />
              </div>
            </div>
          ) : (
            <>
              <Bubble who={t.you}>
                <div
                  data-testid="chat-intent"
                  className="self-start max-w-full px-4 py-3 rounded-[var(--radius-lg)] text-[14px] leading-relaxed whitespace-pre-wrap break-words"
                  style={{ backgroundColor: "var(--accent-soft)", color: "var(--ink)" }}
                >
                  {state.intent}
                </div>
              </Bubble>
              <Bubble who={t.system}>
                <ChatReply state={state} />
              </Bubble>
            </>
          )}
        </div>

        <div className="sticky bottom-0 pb-4 pt-2 flex flex-col gap-3" style={{ backgroundColor: "var(--bg-app)" }}>
          {!started && (
            <div className="flex flex-wrap gap-2">
              {t.examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setDraft(example)}
                  className="px-3 py-1.5 rounded-full border text-[12.5px] text-left cursor-pointer transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
                >
                  {example}
                </button>
              ))}
            </div>
          )}
          {started && !running ? (
            <div className="flex flex-wrap items-center justify-between gap-3 py-2">
              <span className="text-[13px]" style={{ color: "var(--ink-soft)" }}>
                {t.done}
              </span>
              <Button onClick={reset} data-testid="chat-new">
                <RotateCcw size={15} aria-hidden="true" />
                {t.newRequest}
              </Button>
            </div>
          ) : (
            <ChatComposer
              value={draft}
              onChange={setDraft}
              onSubmit={submit}
              onStop={stop}
              running={running}
              blockedReason={ready ? undefined : t.needKeys}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
