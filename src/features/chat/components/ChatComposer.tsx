/**
 * Ô soạn kiểu LLM chat (dùng cho câu trả lời duy nhất khi hệ thống hỏi lại):
 * Enter gửi, Shift + Enter xuống dòng, tự giãn chiều cao.
 */
"use client";

import { ArrowUp, Square } from "lucide-react";
import React, { useLayoutEffect, useRef } from "react";
import { i18n } from "@/i18n/vi";

const t = i18n.chat;

export interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  running?: boolean;
  /** Lý do chưa gửi được (ví dụ chưa nhập key); hiện dưới ô nhập. */
  blockedReason?: string;
}

const LABELS = { label: t.answerLabel, placeholder: t.answerPlaceholder, hint: t.answerHint, submit: t.send };

export function ChatComposer({ value, onChange, onSubmit, onStop, running, blockedReason }: ChatComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const canSend = !running && !blockedReason && value.trim() !== "";

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSubmit();
      }}
      className="flex flex-col gap-1.5"
    >
      <div
        className="flex items-end gap-2 p-2 pl-4 rounded-[var(--radius-lg)] border transition-[border-color,box-shadow] focus-within:border-[var(--accent-line)] focus-within:ring-2 focus-within:ring-[var(--focus-ring)]"
        style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-md)" }}
      >
        <label htmlFor="chat-input" className="sr-only">
          {LABELS.label}
        </label>
        <textarea
          id="chat-input"
          ref={ref}
          rows={1}
          value={value}
          disabled={running}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (canSend) onSubmit();
            }
          }}
          placeholder={LABELS.placeholder}
          className="flex-1 min-w-0 resize-none bg-transparent py-2 text-[14.5px] leading-relaxed outline-none disabled:opacity-60"
          style={{ color: "var(--ink)" }}
        />
        {running ? (
          <button
            type="button"
            onClick={onStop}
            aria-label={t.stop}
            title={t.stop}
            className="grid place-items-center size-9 shrink-0 rounded-full cursor-pointer border"
            style={{ borderColor: "var(--border-default)", color: "var(--ink)" }}
          >
            <Square size={13} fill="currentColor" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            aria-label={LABELS.submit}
            title={LABELS.submit}
            data-testid="chat-send"
            className="grid place-items-center size-9 shrink-0 rounded-full cursor-pointer bg-[var(--accent)] text-[var(--on-accent)] transition-opacity disabled:opacity-35 disabled:cursor-not-allowed"
          >
            <ArrowUp size={17} aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="m-0 px-2 text-[12px]" style={{ color: blockedReason ? "var(--v-spec)" : "var(--ink-soft)" }}>
        {blockedReason ?? LABELS.hint}
      </p>
    </form>
  );
}
