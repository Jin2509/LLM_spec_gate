import { PartyPopper } from "lucide-react";
import React from "react";

export function QueueCompleted() {
  return (
    <div className="p-12 text-center border rounded shadow-sm space-y-3" style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--rule)", borderRadius: "var(--r-card)" }}>
      <PartyPopper size={32} className="mx-auto" style={{ color: "var(--action)" }} aria-hidden="true" />
      <h2 className="text-base font-bold font-mono" style={{ color: "var(--ink)" }}>
        Hàng đợi Gán Nhãn Đã Hoàn Thành!
      </h2>
      <p className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
        Tất cả các vé hỏi người trong lượt chạy này đã được phản hồi hoặc hoãn lại.
      </p>
    </div>
  );
}
