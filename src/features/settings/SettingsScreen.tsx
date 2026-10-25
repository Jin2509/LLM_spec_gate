"use client";

import React, { useState } from "react";
import { AppShell } from "@/ui/shell";
import { Button } from "@/ui/primitives/Button";
import { ErrorState, Notice, PageHeader, QueryBoundary } from "@/ui/layout";
import { api, toDisplayError, useApiQuery, type DisplayError, type LabSettings } from "@/lib/api";
import { useRouteParam } from "@/features/runs/use-run-id";
import { ApiKeysNotice } from "./components/ApiKeysNotice";
import { ModelBudgetSection, ResearchFlagsSection, SolverTimeoutSection } from "./components/SettingsSections";

export function SettingsScreen() {
  const runId = useRouteParam("runId");
  const settingsQuery = useApiQuery("settings", (signal) => api.settings.get(signal));
  const [draft, setDraft] = useState<Partial<LabSettings>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: true; text: string } | ({ ok: false } & DisplayError) | null>(null);

  const current = settingsQuery.data && { ...settingsQuery.data.settings, ...draft };
  const onChange = <K extends keyof LabSettings>(key: K, value: LabSettings[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const handleSave = async () => {
    if (!current) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const saved = await api.settings.update(current);
      settingsQuery.setData(() => saved);
      setDraft({});
      setFeedback({ ok: true, text: "Đã lưu các cấu hình tham số thí nghiệm thành công." });
    } catch (error) {
      setFeedback({ ok: false, ...toDisplayError(error) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell currentRunId={runId}>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2 font-sans">
        <PageHeader
          testId="settings-header"
          eyebrow={<>Cài đặt Hệ thống &amp; Tham số Phòng thí nghiệm</>}
          title={<>Laboratory Settings &amp; Execution Policies</>}
          description="Cấu hình ngân sách tài nguyên, thời gian chờ Z3/A3 và cơ chế an toàn dữ liệu khoa học."
          actions={
            <Button data-testid="save-settings-btn" variant="primary" disabled={!current || isSaving} onClick={() => void handleSave()}>
              {isSaving ? "Đang lưu..." : "Lưu Cấu hình"}
            </Button>
          }
        />

        {feedback &&
          (feedback.ok ? (
            <Notice tone="success" testId="settings-feedback">
              ✓ {feedback.text}
            </Notice>
          ) : (
            <ErrorState message={feedback.message} status={feedback.status} />
          ))}

        <QueryBoundary query={settingsQuery} loadingLabel="Đang tải Cài đặt...">
          {({ models, settings }) => {
            const values = { ...settings, ...draft };
            return (
              <>
                <ModelBudgetSection settings={values} models={models} onChange={onChange} />
                <SolverTimeoutSection settings={values} onChange={onChange} />
                <ResearchFlagsSection settings={values} onChange={onChange} />
              </>
            );
          }}
        </QueryBoundary>

        <ApiKeysNotice />
      </div>
    </AppShell>
  );
}
