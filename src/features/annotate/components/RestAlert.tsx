"use client";

import { Coffee } from "lucide-react";
import React from "react";
import { Button } from "@/ui/primitives/Button";

export function RestAlert({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      data-testid="rest-alert"
      className="p-4 border rounded flex items-start justify-between gap-3 animate-in fade-in"
      style={{ backgroundColor: "var(--v-spec-bg)", borderColor: "var(--v-spec)", color: "var(--v-spec)", borderRadius: "var(--r-card)" }}
    >
      <div className="text-xs font-mono">
        <Coffee size={16} className="inline-block shrink-0 align-[-2px]" style={{ marginRight: 8 }} aria-hidden="true" />
        <strong>Cảnh báo bảo vệ độ tập trung:</strong> Bạn đã hoàn thành 15 thẻ liên tục. Khuyến nghị nghỉ mắt 2 phút để duy trì độ chuẩn xác và không bị mệt mỏi nhận thức (cognitive fatigue).
      </div>
      <Button variant="secondary" size="sm" onClick={onDismiss} className="shrink-0 text-xs">
        Tiếp tục
      </Button>
    </div>
  );
}
