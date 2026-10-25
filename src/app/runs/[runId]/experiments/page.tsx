import { Suspense } from "react";
import { PageFallback } from "@/ui/layout";
import { ExperimentsScreen } from "@/features/experiments";

export default function RunExperimentsPage() {
  return (
    <Suspense fallback={<PageFallback label="Đang tải Experiment Runner..." />}>
      <ExperimentsScreen />
    </Suspense>
  );
}
