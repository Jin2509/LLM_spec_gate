import { Suspense } from "react";
import RunDetails from "./RunDetails";

export default function RunDetailPage({ params }: PageProps<"/history/[runId]">) {
  return <Suspense fallback={<main className="eval-page">Đang tải phiên…</main>}><ResolvedRun params={params} /></Suspense>;
}

async function ResolvedRun({ params }: { params: PageProps<"/history/[runId]">["params"] }) {
  const { runId } = await params;
  return <RunDetails runId={runId} />;
}
