"use client";

import React from "react";
import { i18n } from "@/i18n/vi";

export interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export function ChatComposer({ value, onChange, onSend, disabled }: ChatComposerProps) {
  return (
    <div className="composer-wrap">
      <div className="composer-box">
        <textarea
          aria-label={i18n.chat.inputLabel}
          value={value}
          disabled={disabled}
          rows={2}
          placeholder={disabled ? i18n.chat.locked : i18n.chat.placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <button className="primary-button" onClick={onSend} disabled={disabled || !value.trim()} aria-label={i18n.chat.send}>
          {i18n.chat.send}
        </button>
      </div>
      <div className="composer-hint">{i18n.chat.keyboardHint}</div>
    </div>
  );
}
