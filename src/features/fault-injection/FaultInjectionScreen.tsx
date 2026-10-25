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
      <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2 font-sans">
        <PageHeader
          testId="fault-injection-header"
          eyebrow={<>Phòng Thí nghiệm Độ bền &amp; Tiêm lỗi (Fault Injection)</>}
          eyebrowTone="danger"
          title={<>Controlled Perturbation &amp; Misattribution Stress Test</>}
          description="Mô phỏng sai lệch tại 3 khu vực để kiểm chứng độ bền của bộ phân xử và hàng rào Gate fail-closed."
          actions={
            <Button data-testid="run-injection-btn" variant="danger" disabled={isSimulating || !profile} onClick={() => void handleRun()}>
              {isSimulating ? "Đang kiểm thử..." : <><Zap size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" /> Thực hiện Tiêm lỗi & Phân tích</>}
            </Button>
          }
        />

        {runError && <ErrorState {...runError} />}

        <QueryBoundary query={stateQuery} loadingLabel="Đang tải Phòng Tiêm lỗi...">
          {(state) => {
            const current = { ...state.defaults, ...profileEdits };
            const edit = (key: keyof FaultInjectionProfile) => (value: string) => setProfileEdits((p) => ({ ...p, [key]: value }));
            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <FaultZoneCard
                    zone={1}
                    title="Khu 1: Lỗi Đặc tả P0"
                    tag="Spec Faults"
                    selectLabel="Kiểu sai lệch đặc tả:"
                    selectTestId="select-spec-fault"
                    hint="Thử thách khả năng R2/R3 nhận diện SPEC_FAULT và kích hoạt repair."
                    value={current.specFault}
                    options={state.options.specFaults}
                    onChange={edit("specFault")}
                  />
                  <FaultZoneCard
                    zone={2}
                    title="Khu 2: Lỗi Mã nguồn C"
                    tag="Code Faults"
                    selectLabel="Kiểu đột biến code:"
                    selectTestId="select-code-fault"
                    hint="Thử thách khả năng R5 quy đúng CODE_FAULT và chặn sửa nhầm đặc tả."
                    value={current.codeFault}
                    options={state.options.codeFaults}
                    onChange={edit("codeFault")}
                  />
                  <FaultZoneCard
                    zone={3}
                    title="Khu 3: Lỗi Nguồn Tin cậy"
                    tag="Oracle Noise"
                    selectLabel="Kiểu làm nhiễu nguồn Grounded:"
                    selectTestId="select-trusted-fault"
                    hint="Đo lường giới hạn phân xử khi tiên đề Grounded bị vi phạm."
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
