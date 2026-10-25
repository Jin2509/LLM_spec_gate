"use client";

import React, { useState } from "react";
import { ErrorState } from "@/ui/layout";
import { api, errorMessage, useApiQuery } from "@/lib/api";
import { EvalNav } from "@/features/evaluation/EvalNav";
import { EMPTY_HISTORY_FILTERS, HistoryFilters, type HistoryFilterValues } from "./components/HistoryFilters";
import { RunsTable } from "./components/RunsTable";
import { Pagination } from "./components/Pagination";
import { HistoryActions } from "./components/HistoryActions";

const PAGE_SIZE = 25;
const CLEAR_CONFIRMATION = "XOA LICH SU";

export function HistoryScreen() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<HistoryFilterValues>(EMPTY_HISTORY_FILTERS);
  const [actionError, setActionError] = useState<string | null>(null);
  const runsQuery = useApiQuery(`runs:${page}:${JSON.stringify(filters)}`, (signal) =>
    api.runs.list({ ...filters, page, pageSize: PAGE_SIZE }, signal),
  );

  const handleFilters = (next: HistoryFilterValues) => {
    setFilters(next);
    setPage(1);
  };

  const handleClear = async () => {
    const confirmation = window.prompt(`Để xóa lịch sử, nhập chính xác: ${CLEAR_CONFIRMATION}`);
    if (confirmation !== CLEAR_CONFIRMATION) return;
    try {
      await api.runs.clear(confirmation);
      setPage(1);
      runsQuery.reload();
    } catch (error) {
      setActionError(errorMessage(error));
    }
  };

  const total = runsQuery.data?.total ?? 0;

  return (
    <main className="eval-page">
      <EvalNav current="/history" />
      <header className="eval-header">
        <div>
          <h1>Lịch sử phiên chạy</h1>
          <p>{total} bản ghi · lưu trong JSONL phía máy chủ</p>
        </div>
        <HistoryActions onClear={() => void handleClear()} />
      </header>
      <HistoryFilters value={filters} onChange={handleFilters} />
      {(actionError || runsQuery.error) && <ErrorState message={actionError ?? runsQuery.error ?? ""} status={actionError ? undefined : runsQuery.errorStatus} onRetry={runsQuery.reload} />}
      <RunsTable runs={runsQuery.data?.runs ?? []} />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </main>
  );
}
