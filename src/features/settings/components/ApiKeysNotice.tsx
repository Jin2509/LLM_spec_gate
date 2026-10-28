/**
 * Ghi chú về API key. Trang Cài đặt KHÔNG có ô nhập key
 * (kiểm thử: tests/ui/settings-no-client-api-key.test.tsx); key cho hỏi đáp nhập ở trang Hỏi đáp.
 */
import { Lock } from "lucide-react";
import Link from "next/link";
import React from "react";

export function ApiKeysNotice() {
  return (
    <section
      data-testid="api-keys-placeholder"
      className="px-5 py-4 rounded-[var(--radius-md)] border flex gap-3"
      style={{ backgroundColor: "var(--accent-soft)", borderColor: "var(--accent-line)" }}
    >
      <Lock size={18} className="shrink-0 mt-0.5" aria-hidden="true" style={{ color: "var(--accent)" }} />
      <div className="flex flex-col gap-2 min-w-0">
        <h2 className="m-0 text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>
          API key không được lưu ở đây
        </h2>
        <p className="m-0 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Key của 2 LLM (sinh đặc tả, sinh code) nhập ở trang{" "}
          <Link href="/" className="underline underline-offset-2" style={{ color: "var(--accent)" }}>
            Hỏi đáp
          </Link>
          . Key chỉ được giữ trong tab đó (sessionStorage): tải lại trang vẫn còn, <strong>đóng tab là mất</strong>.
          Key được gửi kèm từng yêu cầu; backend không ghi key vào cơ sở dữ liệu hay nhật ký.
        </p>
        <p className="m-0 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Các lượt chạy thực nghiệm dùng key đặt trong biến môi trường của backend:
        </p>
        <pre
          className="m-0 px-3 py-2.5 rounded-[var(--radius-sm)] text-[12px] overflow-x-auto"
          style={{ backgroundColor: "var(--bg-elevated)", color: "var(--ink)" }}
        >{`# .env của backend (spec_gate_backend)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."`}</pre>
      </div>
    </section>
  );
}
