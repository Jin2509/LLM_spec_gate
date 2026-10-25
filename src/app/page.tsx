import { Suspense } from "react";
import { PageFallback } from "@/ui/layout";
import { ChatScreen } from "@/features/chat";

export default function Home() {
  return (
    <Suspense fallback={<PageFallback label="Đang tải phiên kiểm thử..." />}>
      <ChatScreen />
    </Suspense>
  );
}
