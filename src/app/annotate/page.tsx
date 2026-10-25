import { Suspense } from "react";
import { PageFallback } from "@/ui/layout";
import { AnnotateScreen } from "@/features/annotate";

export default function DefaultAnnotatePage() {
  return (
    <Suspense fallback={<PageFallback label="Đang tải hàng đợi gán nhãn..." />}>
      <AnnotateScreen />
    </Suspense>
  );
}
