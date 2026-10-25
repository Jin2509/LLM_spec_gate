import { ShieldCheck, TriangleAlert } from "lucide-react";
import React from "react";
import { toneStyle } from "@/ui/layout";

export function InvariantBadge({ holds }: { holds: boolean }) {
  return (
    <div
      data-testid="disjointness-invariant-badge"
      className="flex items-center gap-2 px-3 py-2 rounded border font-mono text-xs font-semibold"
      style={toneStyle(holds ? "success" : "danger")}
    >
      {holds ? <ShieldCheck size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" /> : <TriangleAlert size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" />}
      <span>BẤT BIẾN G ∩ B = ∅: {holds ? "HỢP LỆ (Giao rỗng)" : "VI PHẠM XUNG ĐỘT"}</span>
    </div>
  );
}
