import { Suspense } from "react";
import { PageFallback } from "@/ui/layout";
import { LibraryScreen } from "@/features/library";

export default function LibraryPage() {
  return (
    <Suspense fallback={<PageFallback label="Đang tải thư viện task..." />}>
      <LibraryScreen />
    </Suspense>
  );
}
