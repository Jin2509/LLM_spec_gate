import { ShieldCheck, TriangleAlert } from "lucide-react";
import React from "react";
import { Badge } from "@/ui/layout";

/** Bất biến G ∩ B = ∅ do backend tính trên kho bằng chứng; UI chỉ hiển thị. */
export function InvariantBadge({ holds }: { holds: boolean }) {
  return (
    <span data-testid="disjointness-invariant-badge" title="G ∩ B = ∅: kho đúng và kho sai không có cặp chung">
      <Badge tone={holds ? "success" : "danger"}>
        {holds ? <ShieldCheck size={14} aria-hidden="true" /> : <TriangleAlert size={14} aria-hidden="true" />}
        {holds ? "Kho G và B tách biệt" : "Kho G và B đang giao nhau"}
      </Badge>
    </span>
  );
}
