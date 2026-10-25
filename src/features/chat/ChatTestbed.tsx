"use client";

import React, { useCallback, useEffect, useReducer, useState } from "react";
import type { CaseDossier } from "@/core/types";
import { api, useApiQuery, type PatchRunRequest } from "@/lib/api";
import { ErrorState } from "@/ui/layout";
import { useDualOracleStream } from "@/ui/chat/useDualOracleStream";
import { i18n } from "@/i18n/vi";
import { INITIAL_CHAT_STATE, chatReducer, isUnknownVerdict } from "./chat-session";
import { MessageBlock } from "./components/MessageBlock";
import { ChatComposer } from "./components/ChatComposer";
import { VerdictPanel } from "./components/VerdictPanel";
import { AdvancedDrawer } from "./components/AdvancedDrawer";
import { SessionBar } from "./components/SessionBar";
import { SessionSidebar } from "./components/SessionSidebar";
import { LiveLogPanel } from "./components/LiveLogPanel";

export interface ChatTestbedProps {
  runId: string;
  /** Case mở đầu; bỏ trống thì lấy case đầu tiên backend trả về cho run. */
  initialCaseId?: string;
}

export function ChatTestbed({ initialCaseId, runId }: ChatTestbedProps) {
  const [caseId, setCaseId] = useState(initialCaseId);
  const [datasetId, setDatasetId] = useState<string>();
  const [state, dispatch] = useReducer(chatReducer, INITIAL_CHAT_STATE);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{ id: string; title: string }[]>([]);
  const [panelOpen, setPanelOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [evaluationRunId, setEvaluationRunId] = useState<string>();

  const datasetsQuery = useApiQuery("datasets", (signal) => api.datasets.list(signal));
  const casesQuery = useApiQuery(`cases:${runId}`, (signal) => api.cases.list({ runId }, signal));
  const datasets = datasetsQuery.data?.datasets ?? [];
  const dataset = datasets.find((d) => d.id === datasetId) ?? datasets[0];
  const cases = casesQuery.data?.cases ?? [];
  const currentCase = cases.find((c) => c.id === caseId) ?? cases[0];
  const task = dataset?.tasks.find((entry) => entry.id === currentCase?.taskId);

  const stream = useDualOracleStream(runId);
  const result = [...state.turns].reverse().find((turn) => turn.role === "system");
  const finished = state.phase === "final";
  const canAskFollowup = state.phase === "unknown_followup" && !state.followupUsed;
  const loadError = datasetsQuery.error ? datasetsQuery : casesQuery.error ? casesQuery : undefined;

  const persist = useCallback(
    (body: PatchRunRequest) => {
      if (evaluationRunId) void api.runs.patch(evaluationRunId, body).catch(() => undefined);
    },
    [evaluationRunId],
  );

  useEffect(() => {
    if (stream.isStreaming || !stream.finalVerdict || state.phase !== "asking") return;
    const text = stream.streamedText || currentCase?.adjudication.explanation || "";
    dispatch({ type: "result", text, verdict: stream.finalVerdict, ms: stream.totalMs });
    persist({
      patch: { status: isUnknownVerdict(stream.finalVerdict) ? "answered" : "final" },
      turn: { role: "system", content: text, verdict: stream.finalVerdict, latencyMs: stream.totalMs },
      verdict: stream.finalVerdict,
      latency: { adjudication: stream.totalMs ?? 0 },
      log: `Hoàn tất phân xử: ${stream.finalVerdict}`,
    });
  }, [stream.isStreaming, stream.finalVerdict, stream.streamedText, stream.totalMs, state.phase, currentCase, persist]);

  useEffect(() => {
    if (stream.error && !stream.isStreaming) dispatch({ type: "error", text: stream.error });
  }, [stream.error, stream.isStreaming]);

  /** Lượt bổ sung duy nhất: tiêu vé hỏi single-shot; backend trả verdict cuối. */
  const resolveFollowup = async (dossier: CaseDossier, text: string) => {
    if (!dossier.ticket) return;
    try {
      const response = await api.tickets.answer(dossier.ticket.id, { answer: text, durationMs: 0 });
      if (!response.resolvedVerdict) throw new Error("Backend không trả verdict cuối cho lượt bổ sung.");
      const verdict = response.resolvedVerdict;
      const explanation = response.explanation ?? dossier.adjudication.explanation;
      dispatch({ type: "resolved", text: `${i18n.chat.followupRecorded}\n\n${explanation}`, verdict });
      persist({
        patch: { status: "final" },
        turn: { role: "system", content: explanation, verdict },
        verdict,
        log: `Đã dùng lượt bổ sung; verdict cuối: ${verdict}`,
      });
    } catch (error) {
      dispatch({ type: "error", text: error instanceof Error && error.message ? error.message : i18n.chat.retryError });
    }
  };

  const retry = async () => {
    if (!currentCase) return;
    const lastText = state.turns.at(-1)?.text ?? "";
    if (state.followupUsed && currentCase.ticket) {
      await resolveFollowup(currentCase, lastText);
    } else {
      dispatch({ type: "retry" });
      void stream.startStream(currentCase, lastText);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || !currentCase || stream.isStreaming || finished) return;
    setInput("");

    if (canAskFollowup && currentCase.ticket) {
      dispatch({ type: "followup", text, id: `u-${Date.now()}` });
      try {
        if (evaluationRunId) await api.runs.followup(evaluationRunId, text);
      } catch {
        dispatch({ type: "error", text: i18n.chat.retryError });
        return;
      }
      await resolveFollowup(currentCase, text);
      return;
    }

    dispatch({ type: "send", text, id: `u-${Date.now()}` });
    setHistory((prev) => [{ id: `${Date.now()}`, title: text.slice(0, 64) }, ...prev]);
    if (dataset) {
      try {
        const saved = await api.runs.createEvaluation({
          mode: "evaluation",
          datasetId: dataset.id,
          datasetVersion: dataset.version,
          problemId: currentCase.taskId,
          problem: text,
        });
        setEvaluationRunId(saved.run.run_id);
      } catch {
        // Luồng phân xử vẫn chạy được khi lưu trữ lịch sử tạm thời lỗi.
      }
    }
    void stream.startStream(currentCase, text);
  };

  const newSession = () => {
    stream.stopStream();
    dispatch({ type: "reset" });
    setInput("");
    setEvaluationRunId(undefined);
    const ids = cases.map((c) => c.id);
    if (ids.length) setCaseId(ids[(ids.indexOf(currentCase?.id ?? "") + 1) % ids.length]);
  };

  return (
    <div className="chat-shell">
      <SessionSidebar history={history} onNew={newSession} onClear={() => setHistory([])} />
      <main className="chat-main">
        <SessionBar
          dataset={dataset}
          runId={runId}
          finished={finished}
          activeStep={state.phase === "idle" ? 1 : 3}
          onAdvanced={() => setDrawerOpen(true)}
          onNew={newSession}
          onShowResult={() => setPanelOpen(true)}
          showResult={panelOpen}
        />
        <div className={`workspace ${panelOpen ? "with-panel" : ""}`}>
          <section className="conversation" aria-live="polite">
            <div className="turn-status">
              <span>
                {state.phase === "idle"
                  ? i18n.chat.turnOne
                  : canAskFollowup
                    ? i18n.chat.followupLeft
                    : state.followupUsed
                      ? i18n.chat.followupUsed
                      : i18n.chat.turnOne}
              </span>
              <span>{currentCase ? `${task?.name ?? currentCase.taskId} · ${currentCase.id}` : "…"}</span>
            </div>
            {loadError && <ErrorState message={loadError.error ?? ""} status={loadError.errorStatus} onRetry={loadError.reload} />}
            {casesQuery.data && !cases.length && <div className="neutral-note">Run {runId} chưa có hồ sơ vụ việc nào để kiểm thử.</div>}
            {state.phase === "idle" && <div className="agent-notice">{i18n.chat.backendLimitation}</div>}
            {!state.turns.length && (
              <div className="empty-state">
                <p>{i18n.chat.emptyTitle}</p>
                <div className="example-list">
                  {i18n.chat.examples.map((example, index) => (
                    <button key={`example-${index}`} className="text-button example-button" onClick={() => setInput(example)}>
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {state.turns.map((turn) => (
              <MessageBlock key={turn.id} turn={turn} />
            ))}
            {stream.isStreaming && (
              <div className="loading-line" role="status">
                {i18n.chat.loading}
              </div>
            )}
            {state.error && (
              <div className="error-box" role="alert">
                {state.error}
                <button className="text-button" onClick={() => void retry()}>
                  {i18n.chat.retry}
                </button>
              </div>
            )}
            {result?.verdict && isUnknownVerdict(result.verdict) && canAskFollowup && <div className="neutral-note">{i18n.chat.unknownNotice}</div>}
            {finished && <div className="locked-note">{i18n.chat.sessionFinished}</div>}
            <LiveLogPanel key={evaluationRunId ?? "no-run"} runId={evaluationRunId} />
            <ChatComposer
              value={input}
              onChange={setInput}
              onSend={() => void send()}
              disabled={!currentCase || stream.isStreaming || finished || (state.followupUsed && !finished)}
            />
          </section>
          {panelOpen && <VerdictPanel item={result} dataset={dataset} runId={evaluationRunId ?? runId} onClose={() => setPanelOpen(false)} />}
        </div>
      </main>
      <AdvancedDrawer open={drawerOpen} datasets={datasets} datasetId={dataset?.id} onDataset={setDatasetId} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
