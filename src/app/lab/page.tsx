/**
 * src/app/lab/page.tsx — SpecGate Workbench (LLM Interaction Testbed)
 */
import { Suspense } from "react";
import { PageFallback } from "@/ui/layout";
import { ChatScreen } from "@/features/chat";

export default function LabPage() {
  return (
    <Suspense fallback={<PageFallback label="Đang tải Lab Testbed..." />}>
      <ChatScreen />
    </Suspense>
  );
}
