import { Suspense } from "react";
import { RunDetailScreen } from "@/features/history";

export default function RunDetailPage({ params }: PageProps<"/history/[runId]">) {
  return (
    <Suspense fallback={<main className="shell-page">Đang tải phiên…</main>}>
      <ResolvedRun params={params} />
    </Suspense>
  );
}

async function ResolvedRun({ params }: { params: PageProps<"/history/[runId]">["params"] }) {
  const { runId } = await params;
  return <RunDetailScreen runId={runId} />;
}
