/**
 * Dòng chọn dataset và tác vụ cho mô hình (GET /api/datasets).
 * Chưa có dataset thì cho tải tệp JSONL lên (POST /api/datasets); backend kiểm tra từng dòng.
 */
"use client";

import { Database, Upload } from "lucide-react";
import React, { useRef, useState } from "react";
import type { AcademicTask } from "@/core/types";
import { api, errorMessage, useApiQuery, type DatasetListResponse } from "@/lib/api";
import { i18n } from "@/i18n/vi";
import { Field, inputClass } from "@/ui/primitives/Field";
import { Notice } from "@/ui/layout";

const t = i18n.dataset;

export interface DatasetSelection {
  datasetId: string;
  task: AcademicTask;
}

export function DatasetPicker({ value, onChange }: { value?: DatasetSelection; onChange: (value?: DatasetSelection) => void }) {
  const query = useApiQuery<DatasetListResponse>("datasets", (signal) => api.datasets.list(signal));
  const fileRef = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<{ busy?: boolean; message?: string; errors?: string[] }>({});
  const datasets = query.data?.datasets ?? [];
  const dataset = datasets.find((d) => d.id === value?.datasetId) ?? datasets[0];

  const selectDataset = (id: string) => {
    const next = datasets.find((d) => d.id === id);
    onChange(next?.tasks[0] ? { datasetId: next.id, task: next.tasks[0] } : undefined);
  };

  const onFile = async (file: File) => {
    setUpload({ busy: true });
    try {
      const result = await api.datasets.uploadJsonl(await file.text());
      setUpload({ message: result.message ?? t.uploaded });
      query.reload();
    } catch (error) {
      const body = (error as { body?: { errors?: Array<{ line: number; message: string }> } }).body;
      setUpload({ message: body?.errors ? t.uploadErrors : errorMessage(error), errors: body?.errors?.slice(0, 5).map((e) => `Dòng ${e.line}: ${e.message}`) });
    }
  };

  return (
    <section
      aria-label={t.label}
      data-testid="dataset-picker"
      className="flex flex-col gap-3 p-4 rounded-[var(--radius-lg)] border"
      style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-subtle)" }}
    >
      {query.error ? (
        <Notice tone="danger">{query.error}</Notice>
      ) : !query.data ? (
        <span className="text-[13px]" style={{ color: "var(--ink-soft)" }}>
          {t.loading}
        </span>
      ) : datasets.length === 0 ? (
        <p className="m-0 flex gap-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
          <Database size={16} className="shrink-0 mt-0.5" aria-hidden="true" style={{ color: "var(--accent)" }} />
          {t.empty}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Field label={t.label}>
            <select value={dataset?.id ?? ""} onChange={(e) => selectDataset(e.target.value)} className={inputClass} data-testid="dataset-select">
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.taskCount}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.task}>
            <select
              value={value?.datasetId === dataset?.id ? value?.task.id ?? "" : ""}
              onChange={(e) => {
                const task = dataset?.tasks.find((x) => x.id === e.target.value);
                onChange(dataset && task ? { datasetId: dataset.id, task } : undefined);
              }}
              className={inputClass}
              data-testid="task-select"
            >
              <option value="" disabled>
                {t.choose}
              </option>
              {dataset?.tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {value && (
        <pre
          data-testid="task-intent"
          className="m-0 px-3.5 py-3 rounded-[var(--radius-md)] text-[12.5px] leading-relaxed whitespace-pre-wrap break-words max-h-40 overflow-auto font-mono"
          style={{ backgroundColor: "var(--bg-sunken)", color: "var(--ink)" }}
        >
          {value.task.intentDocstring}
        </pre>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={upload.busy}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium cursor-pointer hover:underline disabled:opacity-50"
          style={{ color: "var(--accent)" }}
        >
          <Upload size={14} aria-hidden="true" />
          {upload.busy ? t.uploading : t.upload}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".jsonl,.ndjson,application/x-ndjson"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void onFile(file);
          }}
        />
        {upload.message && (
          <span className="text-[12.5px]" style={{ color: upload.errors ? "var(--v-code)" : "var(--ink-soft)" }}>
            {upload.message}
          </span>
        )}
      </div>
      {upload.errors && (
        <ul className="m-0 pl-5 text-[12px]" style={{ color: "var(--v-code)" }}>
          {upload.errors.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
