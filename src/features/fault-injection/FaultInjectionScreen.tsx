"use client";

import { Zap } from "lucide-react";
import React, { useState } from "react";
import { AppShell } from "@/ui/shell";
import { Button } from "@/ui/primitives/Button";
import { ErrorState, PageHeader, QueryBoundary } from "@/ui/layout";
import {
  api,
  toDisplayError,
  useApiQuery,
  type DisplayError,
  type FaultInjectionMetrics,
  type FaultInjectionProfile,
} from "@/lib/api";
import { useRouteParam } from "@/features/runs/use-run-id";
import { FaultZoneCard } from "./components/FaultZoneCard";
import { InjectionMetricsPanel } from "./components/InjectionMetricsPanel";
import { TheoreticalLimitCaveat } from "./components/TheoreticalLimitCaveat";

export function FaultInjectionScreen() {
  const runId = useRouteParam("runId");
  const stateQuery = useApiQuery("fault-injection", (signal) => api.faultInjection.get(signal));
  const [profileEdits, setProfileEdits] = useState<Partial<FaultInjectionProfile>>({});
  const [measured, setMeasured] = useState<FaultInjectionMetrics | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [runError, setRunError] = useState<DisplayError | null>(null);

  const profile: FaultInjectionProfile | undefined = stateQuery.data && { ...stateQuery.data.defaults, ...profileEdits };

  const handleRun = async () => {
    if (!profile) return;
    setIsSimulating(true);
    setRunError(null);
    try {
      setMeasured((await api.faultInjection.run(profile)).metrics);
    } catch (error) {
      setRunError(toDisplayError(error));
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <AppShell currentRunId={runId}>
      <div className="flex flex-col gap-6">
        <PageHeader
          testId="fault-injection-header"
          eyebrow="Thực nghiệm"
          title="Tiêm lỗi có kiểm soát"
          description="Cố ý làm sai đặc tả, code hoặc nguồn tham chiếu để đo xem hệ thống có quy lỗi đúng chỗ và có chặn được bản sửa có hại không."
          actions={
            <Button data-testid="run-injection-btn" variant="danger" disabled={isSimulating || !profile} onClick={() => void handleRun()}>
              <Zap size={15} aria-hidden="true" />
              {isSimulating ? "Đang chạy..." : "Tiêm lỗi và đo"}
            </Button>
          }
        />

        {runError && <ErrorState {...runError} />}

        <QueryBoundary query={stateQuery} loadingLabel="Đang tải cấu hình tiêm lỗi...">
          {(state) => {
            const current = { ...state.defaults, ...profileEdits };
            const edit = (key: keyof FaultInjectionProfile) => (value: string) => setProfileEdits((p) => ({ ...p, [key]: value }));
            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FaultZoneCard
                    zone={1}
                    title="Làm sai đặc tả"
                    tag="Vùng 1"
                    selectLabel="Kiểu lỗi"
                    selectTestId="select-spec-fault"
                    hint="Kiểm tra hệ thống có nhận ra lỗi nằm ở đặc tả và đề xuất sửa không."
                    value={current.specFault}
                    options={state.options.specFaults}
                    onChange={edit("specFault")}
                  />
                  <FaultZoneCard
                    zone={2}
                    title="Làm sai code"
                    tag="Vùng 2"
                    selectLabel="Kiểu lỗi"
                    selectTestId="select-code-fault"
                    hint="Kiểm tra hệ thống có quy đúng lỗi cho code và không sửa nhầm đặc tả."
                    value={current.codeFault}
                    options={state.options.codeFaults}
                    onChange={edit("codeFault")}
                  />
                  <FaultZoneCard
                    zone={3}
                    title="Làm sai nguồn tham chiếu"
                    tag="Vùng 3"
                    selectLabel="Kiểu lỗi"
                    selectTestId="select-trusted-fault"
                    hint="Đo giới hạn của hệ thống khi chính nguồn tin cậy bị sai."
                    value={current.trustedFault}
                    options={state.options.trustedFaults}
                    onChange={edit("trustedFault")}
                  />
                </div>
                <InjectionMetricsPanel metrics={measured ?? state.metrics} />
              </>
            );
          }}
        </QueryBoundary>

        <TheoreticalLimitCaveat />
      </div>
    </AppShell>
  );
}
