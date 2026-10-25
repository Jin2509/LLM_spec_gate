import React from "react";
import { i18n } from "@/i18n/vi";

function Kbd({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <kbd className="px-1.5 py-0.5 border rounded bg-[var(--paper-ground)] text-[10px]" style={color ? { color } : undefined}>
      {children}
    </kbd>
  );
}

export function HotkeysBar() {
  return (
    <div
      className="p-3 border rounded text-xs font-mono flex flex-wrap items-center justify-between gap-2"
      style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--rule)", borderRadius: "var(--r-card)", color: "var(--ink)" }}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold">Phím tắt:</span>
        <Kbd>1</Kbd> Chấp nhận
        <Kbd>2</Kbd> Bác bỏ
        <Kbd>Enter</Kbd> Submit
      </div>
      <div className="flex items-center gap-3">
        <span title="Khóa vé vĩnh viễn, ghi nhận intent mơ hồ" className="cursor-help flex items-center gap-1">
          <Kbd color="var(--v-code)">C</Kbd>
          <span>{i18n.ticket.cannotDetermine} (Khóa vĩnh viễn)</span>
        </span>
        <span title="Vé vẫn mở, đưa về cuối hàng đợi làm sau" className="cursor-help flex items-center gap-1">
          <Kbd color="var(--action)">S</Kbd>
          <span>Hoãn (Giữ mở)</span>
        </span>
      </div>
    </div>
  );
}
