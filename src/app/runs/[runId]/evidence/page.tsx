import { Suspense } from "react";
import { PageFallback } from "@/ui/layout";
import { EvidenceScreen } from "@/features/evidence";

export default function EvidencePage() {
  return (
    <Suspense fallback={<PageFallback label="Đang tải Kho Bằng chứng..." />}>
      <EvidenceScreen />
    </Suspense>
  );
}
