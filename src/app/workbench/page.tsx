import { Suspense } from "react";
import { PageFallback } from "@/ui/layout";
import { WorkbenchScreen } from "@/features/workbench";

export default function DefaultWorkbenchPage() {
  return (
    <Suspense fallback={<PageFallback label="Đang tải bàn phân xử..." />}>
      <WorkbenchScreen />
    </Suspense>
  );
}
