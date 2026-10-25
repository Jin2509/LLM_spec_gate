import { Suspense } from "react";
import { PageFallback } from "@/ui/layout";
import { StatsScreen } from "@/features/stats";

export default function StatsPage() {
  return (
    <Suspense fallback={<PageFallback label="Đang tải thống kê..." />}>
      <StatsScreen />
    </Suspense>
  );
}
