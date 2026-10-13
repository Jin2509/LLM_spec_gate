/**
 * src/ui/chat/Composer.tsx — Chat-style Bottom Composer
 *
 * Requirements:
 *   - Anchored at bottom with backdrop blur / gradient overlay above
 *   - Auto-expanding <textarea> (1 line default, max ~8 lines / 200px, internal scroll)
 *   - Enter sends, Shift+Enter new line; Vietnamese IME safe (nativeEvent.isComposing)
 *   - Send button disabled when empty; changes to Stop button (■) when streaming
 *   - Suggestion chips directly above the input box
 *   - Status line at bottom with safe-area inset
 */
"use client";

import React, { useRef, useEffect } from "react";
import { ArrowUp, Square, FileText, Play, PanelRight } from "lucide-react";

export interface ComposerProps {
  input: string;
  onChange: (val: string) => void;
  onSend: (text?: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  onOpenInspector: () => void;
  isInspectorOpen: boolean;
}

export function Composer({
  input,
  onChange,
  onSend,
  onStop,
  isStreaming,
  onOpenInspector,
  isInspectorOpen,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextHeight = Math.min(el.scrollHeight, 200);
    el.style.height = `${Math.max(nextHeight, 38)}px`;
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check if composing with IME (Vietnamese Telex/VNI)
    if (e.nativeEvent.isComposing) {
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        onSend();
      }
    }
  };

  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 20,
        background: "var(--bg-panel)",
        borderTop: "1px solid var(--border-default)",
        paddingBottom: "max(8px, env(safe-area-inset-bottom))",
        flexShrink: 0,
      }}
    >
      {/* Top subtle gradient blend over scrolling messages */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-24px",
          left: 0,
          right: 0,
          height: "24px",
          background: "linear-gradient(to top, var(--bg-panel), transparent)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "8px 16px 4px" }}>
        {/* Suggestion Chips */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "8px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={() => onSend("Mô tả lại bài toán và phân tích lỗi")}
            aria-label="Mô tả lại bài toán và lỗi"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 9px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-app)",
              color: "var(--text-secondary)",
              fontSize: "11px",
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <FileText size={12} />
            Mô tả lại bài toán &amp; lỗi
          </button>

          <button
            type="button"
            onClick={() => onSend("Kiểm thử lại tác vụ với witness w")}
            aria-label="Kiểm thử witness w"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 9px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-app)",
              color: "var(--text-secondary)",
              fontSize: "11px",
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Play size={12} />
            Kiểm thử witness w
          </button>

          <button
            type="button"
            onClick={onOpenInspector}
            aria-label="Mở Bảng phân tích chi tiết"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 9px",
              borderRadius: "var(--radius-sm)",
              border: isInspectorOpen
                ? "1px solid var(--accent)"
                : "1px solid var(--border-subtle)",
              background: isInspectorOpen ? "var(--bg-hover)" : "var(--bg-app)",
              color: isInspectorOpen ? "var(--accent)" : "var(--text-secondary)",
              fontSize: "11px",
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <PanelRight size={12} />
            Mở Bảng phân tích chi tiết
          </button>
        </div>

        {/* Input Textarea Container */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "8px",
            background: "var(--bg-app)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-default)",
            padding: "6px 8px 6px 12px",
            transition: "border-color var(--motion-quick) ease",
          }}
        >
          <textarea
            ref={textareaRef}
            data-testid="chat-composer-input"
            value={input}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder='Nhập câu hỏi, yêu cầu "Mô tả lại", hoặc nhập phản hồi kiểm thử...'
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--text-primary)",
              fontSize: "13px",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.5,
              resize: "none",
              maxHeight: "200px",
              padding: "4px 0",
              overflowY: "auto",
            }}
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              data-testid="chat-composer-stop-btn"
              aria-label="Dừng xử lý"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "var(--v-code)",
                color: "var(--bg-panel)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Square size={13} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSend()}
              data-testid="chat-composer-send-btn"
              disabled={!input.trim()}
              aria-label="Gửi tin nhắn"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: input.trim() ? "var(--accent)" : "var(--border-subtle)",
                color: input.trim() ? "var(--bg-panel)" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: input.trim() ? "pointer" : "not-allowed",
                flexShrink: 0,
                transition: "background var(--motion-quick) ease",
              }}
            >
              <ArrowUp size={15} />
            </button>
          )}
        </div>

        {/* Footer info line */}
        <div
          style={{
            marginTop: "6px",
            fontSize: "10px",
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
            textAlign: "center",
            opacity: 0.75,
          }}
        >
          Dual-Oracle Monitoring v1.4 · Fail-Closed Invariant · Single-Shot Human Query Protected
        </div>
      </div>
    </div>
  );
}
