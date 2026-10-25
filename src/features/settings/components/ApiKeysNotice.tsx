/**
 * Ghi chú bảo mật — TUYỆT ĐỐI không thêm ô nhập API key ở client
 * (kiểm thử: tests/ui/settings-no-client-api-key.test.tsx).
 */
import { Lock } from "lucide-react";
import React from "react";

export function ApiKeysNotice() {
  return (
    <div
      data-testid="api-keys-placeholder"
      className="p-4 rounded border flex flex-col gap-2 font-mono text-xs"
      style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--action)", borderWidth: "1.5px", borderRadius: "var(--r-card)" }}
    >
      <div className="flex items-center gap-2 font-bold" style={{ color: "var(--action)" }}>
        <Lock size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" />
        <span>BẢO MẬT API KEYS: CẤU HÌNH PHÍA SERVER (.env.local)</span>
      </div>
      <p className="m-0 leading-relaxed text-[11px]" style={{ color: "var(--ink)" }}>
        Theo nguyên tắc an toàn dữ liệu khoa học, <strong>hệ thống tuyệt đối cấm lưu trữ API Key ở phía Client</strong> hoặc trong bộ nhớ
        trình duyệt (localStorage/cookies). Mọi API key của nhà cung cấp mô hình (OpenAI, Anthropic, DeepSeek) phải được cấu hình qua biến môi
        trường máy chủ:
      </p>
      <pre className="p-3 rounded border text-[11px] overflow-x-auto" style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--rule)", color: "var(--ink)" }}>
        {`# Cấu hình tại .env.local trên máy chủ triển khai:
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
DEEPSEEK_API_KEY="sk-..."`}
      </pre>
      <span className="text-[10px] opacity-75" style={{ color: "var(--ink-soft)" }}>
        Client chỉ giao tiếp qua các proxy an toàn (Route Handlers) đã được khử dữ liệu độc hại và loại bỏ trường grading.
      </span>
    </div>
  );
}
