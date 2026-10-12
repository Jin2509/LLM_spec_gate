"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/ui/shell";
import { Button } from "@/ui/primitives/Button";
import type { MonitorVersionRecord, BadTraceItem } from "@/core/revocation";

function RevocationContent() {
  const params = useParams();
  const runId = (params?.runId as string) || "run_evalplus_01";

  const [history, setHistory] = useState<MonitorVersionRecord[]>([
    {
      version: "P_0",
      status: "deprecated",
      deployedAt: "2026-10-12T00:00:00Z",
    },
    {
      version: "P_1",
      patchId: "rep_spec_1",
      guard: "len(w) == 4",
      replacement: "ret[0] <= ret[2] and ret[1] == w[1] and ret[3] == w[3]",
      status: "active",
      deployedAt: "2026-10-12T10:30:00Z",
    },
  ]);

  const [isInjecting, setIsInjecting] = useState<boolean>(false);
  const [injectionFeedback, setInjectionFeedback] = useState<string | null>(null);

  // Fetch initial history
  useEffect(() => {
    fetch(`/api/runs/${runId}/revocation`)
      .then((res) => res.json())
      .then((data) => {
        if (data.monitorHistory && Array.isArray(data.monitorHistory)) {
          setHistory(data.monitorHistory);
        }
      })
      .catch(() => {});
  }, [runId]);

  const handleInjectBadTrace = async () => {
    setIsInjecting(true);
    setInjectionFeedback(null);

    const badTrace: BadTraceItem = {
      id: `bad_trace_inject_${Date.now()}`,
      input: [5, 3, 2, 8],
      output: [8, 5, 3, 2],
      inGuard: true,
      description: "Đột biến vi phạm thứ tự phần tử tại chỉ số chẵn trong mảng độ dài 4.",
      injectedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(`/api/runs/${runId}/revocation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trace: badTrace }),
      });
      const data = await res.json();

      if (data.revocationResult?.revoked) {
        setInjectionFeedback(
          `⚡ PHẢN ỨNG DÂY CHUYỀN KÍCH HOẠT: ${data.revocationResult.reason} Nâng cấp Monitor lên ${data.revocationResult.newActiveVersion}.`
        );
      } else {
        setInjectionFeedback("Vết tiêm không xâm phạm vùng guard g. Monitor giữ nguyên.");
      }

      if (data.currentHistory) {
        setHistory(data.currentHistory);
      }
    } catch {
      setInjectionFeedback("Lỗi khi gửi yêu cầu tiêm vết xấu.");
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <AppShell currentRunId={runId}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2">
        {/* Header */}
        <div
          data-testid="revocation-header"
          className="p-4 rounded border flex flex-wrap items-center justify-between gap-4 font-mono text-xs"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "var(--action)" }}>
              Quản lý Vòng đời &amp; Thu hồi Bản vá
            </span>
            <h1 className="text-base font-bold m-0 mt-0.5" style={{ color: "var(--ink)" }}>
              Patch Revocation &amp; Dynamic Monitor Evolution
            </h1>
            <p className="text-[11px] m-0 mt-1 opacity-75" style={{ color: "var(--ink-soft)" }}>
              Quy tắc G2 (Reject-B): Nếu vết xấu mới t ∈ B xâm phạm vùng g của monitor hiện tại, bản vá bị thu hồi ngay lập tức.
            </p>
          </div>

          {/* Exploration Mode Action */}
          <div className="flex items-center gap-3">
            <Button
              data-testid="inject-bad-trace-btn"
              variant="danger"
              disabled={isInjecting}
              onClick={handleInjectBadTrace}
            >
              {isInjecting ? "Đang tiêm..." : "⚡ Tiêm vết xấu vào B"}
            </Button>
          </div>
        </div>

        {/* Injection Feedback Banner */}
        {injectionFeedback && (
          <div
            data-testid="injection-feedback"
            className="p-3 rounded border font-mono text-xs"
            style={{
              backgroundColor: "var(--paper-ground)",
              borderColor: "var(--v-code)",
              color: "var(--v-code)",
            }}
          >
            {injectionFeedback}
          </div>
        )}

        {/* Timeline P0 -> P1 -> ... -> Pk */}
        <div
          data-testid="monitor-timeline"
          className="p-4 rounded border flex flex-col gap-4 font-sans"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--rule)" }}>
            <span className="text-xs font-mono font-semibold" style={{ color: "var(--ink)" }}>
              Dòng thời gian Monitor (P_0 → P_k)
            </span>
            <span className="text-[11px] font-mono" style={{ color: "var(--ink-soft)" }}>
              Tổng cộng {history.length} mốc tiến hóa
            </span>
          </div>

          <div className="flex flex-col gap-3 relative pl-6 border-l-2 ml-4" style={{ borderColor: "var(--rule)" }}>
            {history.map((record, idx) => {
              const isActive = record.status === "active";
              const isRevoked = record.status === "revoked";

              return (
                <div
                  key={`${record.version}_${idx}`}
                  data-testid={`timeline-node-${record.version}`}
                  className="p-3 rounded border font-mono text-xs flex flex-col gap-1.5 relative transition-all"
                  style={{
                    backgroundColor: isActive ? "var(--paper-ground)" : "var(--paper-surface)",
                    borderColor: isRevoked
                      ? "var(--v-code)"
                      : isActive
                      ? "var(--action)"
                      : "var(--rule)",
                    borderWidth: isActive || isRevoked ? "1.5px" : "1px",
                    borderRadius: "var(--r-card)",
                  }}
                >
                  {/* Timeline dot */}
                  <span
                    className="absolute -left-[31px] top-4 w-3 h-3 rounded-full border-2"
                    style={{
                      backgroundColor: isRevoked
                        ? "var(--v-code)"
                        : isActive
                        ? "var(--action)"
                        : "var(--rule)",
                      borderColor: "var(--paper-surface)",
                    }}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm" style={{ color: "var(--ink)" }}>
                        {record.version}
                      </strong>
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-bold uppercase"
                        style={{
                          backgroundColor: isRevoked
                            ? "var(--v-code-bg)"
                            : isActive
                            ? "var(--v-acc-bg)"
                            : "var(--v-neutral-bg)",
                          color: isRevoked
                            ? "var(--v-code)"
                            : isActive
                            ? "var(--v-acc)"
                            : "var(--ink-soft)",
                          border: `1px solid ${
                            isRevoked
                              ? "var(--v-code)"
                              : isActive
                              ? "var(--v-acc)"
                              : "var(--rule)"
                          }`,
                        }}
                      >
                        {record.status}
                      </span>
                    </div>

                    <span className="text-[11px]" style={{ color: "var(--ink-soft)" }}>
                      Triển khai: {record.deployedAt}
                    </span>
                  </div>

                  {record.guard && (
                    <div className="text-[11px] pt-1">
                      <span style={{ color: "var(--ink-soft)" }}>Miền guard g: </span>
                      <code>{record.guard}</code>
                    </div>
                  )}

                  {record.replacement && (
                    <div className="text-[11px]">
                      <span style={{ color: "var(--ink-soft)" }}>Mệnh đề thay thế C&apos;: </span>
                      <code>{record.replacement}</code>
                    </div>
                  )}

                  {isRevoked && (
                    <div
                      data-testid={`revocation-detail-${record.version}`}
                      className="mt-1 p-2 rounded border text-[11px]"
                      style={{
                        backgroundColor: "transparent",
                        borderColor: "var(--v-code)",
                        borderStyle: "dashed",
                        color: "var(--v-code)",
                      }}
                    >
                      <strong>Nguyên nhân Thu hồi:</strong> {record.revocationReason}
                      {record.violatingTraceId && (
                        <div>Vết xấu vi phạm: <code>{record.violatingTraceId}</code></div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function RevocationPage() {
  return (
    <Suspense fallback={<div className="p-8 font-mono text-sm">Đang tải Vòng đời Thu hồi...</div>}>
      <RevocationContent />
    </Suspense>
  );
}
