/**
 * src/app/api/runs/[id]/cases/[caseId]/stream/route.ts — Dual-Oracle Monitoring NDJSON Streaming Endpoint
 *
 * Requirements:
 *   - NDJSON streaming route for real-time stepper & token streaming
 *   - Steps:
 *       1. Nhận witness w và nạp task
 *       2. Thực thi code với w -> lấy đầu ra thực tế c
 *       3. Đánh giá oracle P_0 (đặc tả) -> chấp nhận hoặc bác bỏ, kèm mệnh đề vi phạm nếu có
 *       4. Đánh giá oracle thứ hai (code oracle)
 *       5. Áp dụng luật phán xử (R1, R2, ...) -> ra verdict
 *       6. Kiểm tra bất biến Fail-Closed và quyết định có cần hỏi người (Single-Shot Human Query)
 *   - Strips any grading data using stripGrading
 */
import { NextRequest } from "next/server";
import { SAMPLE_CASES } from "@/mock/fixtures/sample-cases";
import { ACADEMIC_TASKS } from "@/mock/fixtures/academic-tasks";
import { stripGrading } from "@/guard/grading-proxy";
import type { DualOracleStreamEvent } from "@/core/stream-types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; caseId: string }> }
) {
  const { caseId } = await params;
  const caseDossier = SAMPLE_CASES[caseId] ?? SAMPLE_CASES.case_spec_fault!;
  const academicTask = ACADEMIC_TASKS.find((t) => t.id === caseDossier.taskId) ?? {
    id: caseDossier.taskId,
    name: caseDossier.taskId,
    intentDocstring: "Kiểm thử vận hành hàm mục tiêu với đặc tả giám sát song hành.",
  };

  let customPrompt = "";
  try {
    const body = await request.json();
    if (body?.prompt) customPrompt = String(body.prompt);
  } catch {
    // empty or non-json body is fine
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: DualOracleStreamEvent) {
        const line = JSON.stringify(stripGrading(event)) + "\n";
        controller.enqueue(encoder.encode(line));
      }

      const startTime = Date.now();

      try {
        // Bước 1: Nhận witness w và nạp task
        send({
          type: "step",
          id: "load_task",
          status: "running",
          label: "Nhận witness w và nạp task",
        });
        await sleep(120);
        send({
          type: "step",
          id: "load_task",
          status: "done",
          label: "Nhận witness w và nạp task",
          durationMs: 120,
          data: { w: caseDossier.witness, details: academicTask.name },
        });

        // Bước 2: Thực thi code với w -> lấy đầu ra thực tế c
        send({
          type: "step",
          id: "run_code",
          status: "running",
          label: "Thực thi code với w → lấy đầu ra thực tế c",
        });
        await sleep(150);
        send({
          type: "step",
          id: "run_code",
          status: "done",
          label: "Thực thi code với w → lấy đầu ra thực tế c",
          durationMs: 150,
          data: { c: caseDossier.codeOutput },
        });

        // Bước 3: Đánh giá oracle P_0 (đặc tả)
        send({
          type: "step",
          id: "oracle_p0",
          status: "running",
          label: "Đánh giá oracle P_0 (đặc tả)",
        });
        await sleep(140);
        const p0Accepted = !caseDossier.monitorRejectionClause;
        send({
          type: "step",
          id: "oracle_p0",
          status: "done",
          label: "Đánh giá oracle P_0 (đặc tả)",
          durationMs: 140,
          data: {
            accepted: p0Accepted,
            violated: caseDossier.monitorRejectionClause ?? undefined,
          },
        });

        // Bước 4: Đánh giá oracle thứ hai (code oracle / differential evidence)
        send({
          type: "step",
          id: "oracle_code",
          status: "running",
          label: "Đánh giá oracle thứ hai (code oracle / grounded anchor)",
        });
        await sleep(130);
        send({
          type: "step",
          id: "oracle_code",
          status: "done",
          label: "Đánh giá oracle thứ hai (code oracle / grounded anchor)",
          durationMs: 130,
          data: {
            details:
              caseDossier.groundedEvidence.length > 0
                ? `${caseDossier.groundedEvidence.length} chứng cứ Grounded (G)`
                : "Không có anchor Grounded trước",
          },
        });

        // Bước 5: Áp dụng luật phán xử (R1–R6)
        send({
          type: "step",
          id: "adjudicate",
          status: "running",
          label: "Áp dụng luật phán xử (R1–R6) → xác định verdict",
        });
        await sleep(160);
        send({
          type: "step",
          id: "adjudicate",
          status: "done",
          label: "Áp dụng luật phán xử (R1–R6) → xác định verdict",
          durationMs: 160,
          data: {
            rule: caseDossier.adjudication.matchedRule,
            verdict: caseDossier.adjudication.verdict,
          },
        });

        // Bước 6: Kiểm tra bất biến Fail-Closed & Human Query
        send({
          type: "step",
          id: "fail_closed_check",
          status: "running",
          label: "Kiểm tra bất biến Fail-Closed & Single-Shot Human Query",
        });
        await sleep(120);

        const isUnknown =
          caseDossier.adjudication.verdict === "UNKNOWN_EVIDENCE" ||
          caseDossier.adjudication.verdict === "UNKNOWN_CONFLICT" ||
          caseDossier.adjudication.verdict === "UNKNOWN_GATE";

        send({
          type: "step",
          id: "fail_closed_check",
          status: "done",
          label: "Kiểm tra bất biến Fail-Closed & Single-Shot Human Query",
          durationMs: 120,
          data: {
            details: isUnknown
              ? "Bất biến Fail-Closed kích hoạt: Trạng thái không an toàn, yêu cầu hỏi người 1 lần."
              : "Bất biến Fail-Closed bảo toàn: Không yêu cầu can thiệp người.",
          },
        });

        // Nếu là UNKNOWN -> phát event human_query
        if (isUnknown && caseDossier.ticket) {
          send({
            type: "human_query",
            reason:
              caseDossier.adjudication.verdict === "UNKNOWN_CONFLICT"
                ? "UND_C"
                : caseDossier.adjudication.verdict === "UNKNOWN_GATE"
                ? "UND_G"
                : "UND_E",
            promptText: caseDossier.ticket.promptText,
            questionType: caseDossier.ticket.questionType,
          });
        }

        // Token streaming cho lời giải thích
        const explanationText = caseDossier.adjudication.explanation;
        const words = explanationText.split(" ");
        for (let i = 0; i < words.length; i += 3) {
          const chunk = words.slice(i, i + 3).join(" ") + (i + 3 < words.length ? " " : "");
          send({ type: "text", delta: chunk });
          await sleep(40);
        }

        // Done event
        const totalMs = Date.now() - startTime;
        send({
          type: "done",
          verdict: caseDossier.adjudication.verdict,
          totalMs,
        });

        controller.close();
      } catch (err: unknown) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Lỗi không xác định trong luồng phán xử",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
