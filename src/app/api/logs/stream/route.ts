import { NextRequest } from "next/server";
import { getEvaluationRun } from "@/core/evaluation-store";

export async function GET(request: NextRequest) {
  const runId = request.nextUrl.searchParams.get("runId");
  if (!runId) return new Response("runId is required", { status: 400 });
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let sent = 0;
      while (!request.signal.aborted) {
        const run = await getEvaluationRun(runId);
        for (const entry of run?.logs?.slice(sent) ?? []) controller.enqueue(encoder.encode(`data: ${JSON.stringify(entry)}\n\n`));
        sent = run?.logs?.length ?? sent;
        if (!run || run.status === "final" || run.status === "error") break;
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}
