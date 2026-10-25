import { Suspense } from "react";
import { PageFallback } from "@/ui/layout";
import { SettingsScreen } from "@/features/settings";

export default function RunSettingsPage() {
  return (
    <Suspense fallback={<PageFallback label="Đang tải Cài đặt..." />}>
      <SettingsScreen />
    </Suspense>
  );
}
