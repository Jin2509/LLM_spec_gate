import { Suspense } from "react";
import { PageFallback } from "@/ui/layout";
import { RevocationScreen } from "@/features/revocation";

export default function RevocationPage() {
  return (
    <Suspense fallback={<PageFallback label="Đang tải Vòng đời Thu hồi..." />}>
      <RevocationScreen />
    </Suspense>
  );
}
