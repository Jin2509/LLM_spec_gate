import { Suspense } from "react";
import { PageFallback } from "@/ui/layout";
import { HistoryScreen } from "@/features/history";

export default function HistoryPage() {
  return (
    <Suspense fallback={<PageFallback label="Đang tải lịch sử..." />}>
      <HistoryScreen />
    </Suspense>
  );
}
