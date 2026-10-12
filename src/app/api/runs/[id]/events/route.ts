/**
 * src/app/api/runs/[id]/events/route.ts — Server-Sent Events (SSE) Stream
 *
 * Requirements:
 *   - SSE với seq tăng dần (id: <seq>).
 *   - Hỗ trợ Last-Event-ID header / query parameter.
 *   - Ngắt kết nối và nối lại không bị mất hoặc trùng sự kiện.
 */
import { NextRequest } from "next/server";
import { mockRunStore } from "@/mock/runs";
import { stripGrading } from "@/guard/grading-proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const manifest = mockRunStore.getRun(id);

  if (!manifest) {
    return new Response(JSON.stringify({ error: `Run "${id}" không tồn tại.` }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Read Last-Event-ID from header or query param
  const lastEventIdHeader =
    request.headers.get("Last-Event-ID") ||
    request.nextUrl.searchParams.get("lastEventId") ||
    "0";
  const fromSeq = parseInt(lastEventIdHeader, 10) || 0;

  const events = mockRunStore.getEvents(id, fromSeq);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const ev of events) {
        const safeData = stripGrading(ev.data);
        const payload = `id: ${ev.seq}\nevent: ${ev.event}\ndata: ${JSON.stringify(safeData)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
