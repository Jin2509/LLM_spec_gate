import { Suspense } from "react";
import { PageFallback } from "@/ui/layout";
import { RepairGateScreen } from "@/features/repair-gate";

export default function RepairGatePage() {
  return (
    <Suspense fallback={<PageFallback label="Đang tải Không gian sửa đổi..." />}>
      <RepairGateScreen />
    </Suspense>
  );
}
