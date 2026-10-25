import { Suspense } from "react";
import { PageFallback } from "@/ui/layout";
import { ResultsScreen } from "@/features/results";

export default function DefaultRunResultsPage() {
  return (
    <Suspense fallback={<PageFallback label="Đang tải Báo cáo Khoa học..." />}>
      <ResultsScreen />
    </Suspense>
  );
}
