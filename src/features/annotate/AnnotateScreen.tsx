"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/ui/shell";
import { QueryTicket } from "@/ui/domain/QueryTicket";
import { ErrorState, QueryBoundary } from "@/ui/layout";
import { api, toDisplayError, useApiQuery, type AnnotationQueueItem, type DisplayError } from "@/lib/api";
import { RunGate } from "@/features/runs/RunGate";
import { AnnotationProgress } from "./components/AnnotationProgress";
import { RestAlert } from "./components/RestAlert";
import { HotkeysBar } from "./components/HotkeysBar";
import { QueueCompleted } from "./components/QueueCompleted";
import { useAnnotationHotkeys } from "./use-annotation-hotkeys";

const REST_EVERY = 15;

export function AnnotateScreen() {
  return <RunGate>{(runId) => <AnnotateContent runId={runId} />}</RunGate>;
}

function AnnotateContent({ runId }: { runId: string }) {
  const queueQuery = useApiQuery(`annotation-queue:${runId}`, (signal) => api.tickets.queue(runId, signal));
  const [queue, setQueue] = useState<AnnotationQueueItem[] | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0);
  const [showRestAlert, setShowRestAlert] = useState(false);
  const [latencyMs, setLatencyMs] = useState(0);
  const [actionError, setActionError] = useState<DisplayError | null>(null);
  const startTimeRef = useRef(0);

  // Hàng đợi cục bộ được khởi tạo từ server, sau đó tiến lên khi trả lời/hoãn.
  const activeQueue = useMemo(() => queue ?? queueQuery.data?.items ?? [], [queue, queueQuery.data]);
  const currentCase = activeQueue[0];
  const totalCards = queueQuery.data?.total ?? 0;

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [currentCase?.id]);

  const advance = useCallback(() => {
    setQueue(activeQueue.slice(1));
    setCompletedCount((c) => c + 1);
    const next = sessionCompletedCount + 1;
    setSessionCompletedCount(next);
    if (next % REST_EVERY === 0) setShowRestAlert(true);
  }, [activeQueue, sessionCompletedCount]);

  const submit = useCallback(
    async (body: { answer?: unknown; isUncertain?: boolean }) => {
      if (!currentCase) return;
      const now = Date.now();
      const durationMs = startTimeRef.current > 0 ? now - startTimeRef.current : 0;
      startTimeRef.current = now;
      setLatencyMs(durationMs);
      setActionError(null);
      try {
        await api.tickets.answer(currentCase.ticket.id, { ...body, durationMs });
        advance();
      } catch (error) {
        setActionError(toDisplayError(error));
      }
    },
    [currentCase, advance],
  );

  const handleAnswer = useCallback((answer: unknown) => submit({ answer }), [submit]);
  const handleUncertain = useCallback(() => submit({ isUncertain: true }), [submit]);

  const handleDefer = useCallback(async () => {
    if (!currentCase) return;
    startTimeRef.current = Date.now();
    setActionError(null);
    try {
      await api.tickets.defer(currentCase.ticket.id);
      if (activeQueue.length > 1) setQueue([...activeQueue.slice(1), activeQueue[0]!]);
    } catch (error) {
      setActionError(toDisplayError(error));
    }
  }, [currentCase, activeQueue]);

  useAnnotationHotkeys({
    onAccept: () => void handleAnswer(true),
    onReject: () => void handleAnswer(false),
    onUncertain: () => void handleUncertain(),
    onDefer: () => void handleDefer(),
  });

  return (
    <AppShell currentRunId={runId}>
      <div className="max-w-2xl mx-auto space-y-6">
        <AnnotationProgress completed={completedCount} total={totalCards} lastLatencyMs={latencyMs} sessionCompleted={sessionCompletedCount} />
        {showRestAlert && <RestAlert onDismiss={() => setShowRestAlert(false)} />}
        <HotkeysBar />
        {actionError && <ErrorState {...actionError} />}

        <QueryBoundary query={queueQuery} loadingLabel="Đang tải hàng đợi gán nhãn...">
          {() =>
            currentCase ? (
              <div className="flex justify-center pt-2">
                <div className="w-full">
                  <QueryTicket
                    ticket={currentCase.ticket}
                    verdict={currentCase.adjudication.verdict}
                    isUniqueOutput={currentCase.isUniqueOutput}
                    codeOutput={currentCase.codeOutput}
                    onAnswer={handleAnswer}
                    onUncertain={handleUncertain}
                    onDefer={handleDefer}
                  />
                </div>
              </div>
            ) : (
              <QueueCompleted />
            )
          }
        </QueryBoundary>
      </div>
    </AppShell>
  );
}
