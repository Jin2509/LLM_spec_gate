import { Suspense } from "react";
import { PageFallback } from "@/ui/layout";
import { FaultInjectionScreen } from "@/features/fault-injection";

export default function RunFaultInjectionPage() {
  return (
    <Suspense fallback={<PageFallback label="Đang tải Phòng Tiêm lỗi..." />}>
      <FaultInjectionScreen />
    </Suspense>
  );
}
