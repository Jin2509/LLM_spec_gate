import { TriangleAlert } from "lucide-react";
import React from "react";

export function TheoreticalLimitCaveat() {
  return (
    <div
      data-testid="theoretical-limit-caveat"
      className="p-3.5 rounded border font-mono text-xs flex flex-col gap-1.5"
      style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--v-spec)", borderStyle: "dashed", color: "var(--ink)" }}
    >
      <div className="flex items-center gap-2 font-bold" style={{ color: "var(--v-spec)" }}>
        <TriangleAlert size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" />
        <span>CHÚ THÍCH CỐ ĐỊNH VỀ GIỚI HẠN LÝ THUYẾT CỦA NGUỒN SAI</span>
      </div>
      <p className="m-0 leading-relaxed text-[11px] opacity-85">
        Khi nguồn tin cậy grounded (Anchor, A2, A3) bị nhiễu hoặc sai lệch, bộ phân xử không thể bảo đảm tính phân biệt chính quy giữa lỗi mã
        nguồn và lỗi đặc tả theo <em>Định lý giới hạn cục bộ trong phân xử oracle kép</em>. Trong tình huống này, hệ thống sẽ tự động hạ cấp
        phán quyết về <code>UNKNOWN_CONFLICT</code> (R1) hoặc <code>UNKNOWN_EVIDENCE</code> (R6) và chuyển giao quyền quyết định cho con người
        qua thẻ hỏi single-shot.
      </p>
    </div>
  );
}
