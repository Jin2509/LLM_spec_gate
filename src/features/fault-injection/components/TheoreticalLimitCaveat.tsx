import { Info } from "lucide-react";
import React from "react";

export function TheoreticalLimitCaveat() {
  return (
    <div
      data-testid="theoretical-limit-caveat"
      className="px-4 py-3 rounded-[var(--radius-md)] border flex gap-3 text-[13px] leading-relaxed"
      style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
    >
      <Info size={16} className="shrink-0 mt-0.5" aria-hidden="true" style={{ color: "var(--ink-soft)" }} />
      <p className="m-0">
        <strong style={{ color: "var(--ink)" }}>Giới hạn của nguồn tin cậy. </strong>
        Khi chính nguồn tham chiếu (điểm neo, A2, A3) bị làm sai, hệ thống không còn phân biệt chắc chắn được lỗi code với lỗi đặc tả. Khi đó
        kết quả mong đợi là “chưa kết luận” và câu hỏi được chuyển cho người, không phải một phán quyết sai.
      </p>
    </div>
  );
}
