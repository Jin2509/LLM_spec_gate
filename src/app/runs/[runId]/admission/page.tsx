import { Suspense } from "react";
import { PageFallback } from "@/ui/layout";
import { AdmissionScreen } from "@/features/admission";

export default function AdmissionPage() {
  return (
    <Suspense fallback={<PageFallback label="Đang tải kiểm nạp..." />}>
      <AdmissionScreen />
    </Suspense>
  );
}
