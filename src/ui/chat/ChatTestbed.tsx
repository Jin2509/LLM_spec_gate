"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import type { CaseDossier, Verdict } from "@/core/types";
import { SAMPLE_CASES } from "@/mock/fixtures/sample-cases";
import { ACADEMIC_TASKS } from "@/mock/fixtures/academic-tasks";
import { DEFAULT_DATASET, DATASETS } from "@/config/dataset";
import { i18n } from "@/i18n/vi";
import { useDualOracleStream } from "./useDualOracleStream";

type Phase = "idle" | "asking" | "answered" | "unknown_followup" | "final";
type Turn = { id: string; role: "user" | "system"; text: string; verdict?: Verdict; ms?: number };
type State = { phase: Phase; turns: Turn[]; followupUsed: boolean; error?: string };
type Action =
  | { type: "send"; text: string; id: string }
  | { type: "result"; text: string; verdict: Verdict; ms?: number }
  | { type: "followup"; text: string; id: string }
  | { type: "resolved"; text: string; verdict: Verdict }
  | { type: "error"; text: string }
  | { type: "retry" }
  | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "send": return { ...state, phase: "asking", error: undefined, turns: [...state.turns, { id: action.id, role: "user", text: action.text }] };
    case "result": {
      const unknown = action.verdict.startsWith("UNKNOWN");
      return { ...state, phase: unknown ? "unknown_followup" : "final", turns: [...state.turns, { id: `r-${Date.now()}`, role: "system", text: action.text, verdict: action.verdict, ms: action.ms }] };
    }
    case "followup": return { ...state, phase: "asking", followupUsed: true, error: undefined, turns: [...state.turns, { id: action.id, role: "user", text: action.text }] };
    case "resolved": return { ...state, phase: "final", turns: [...state.turns, { id: `r-${Date.now()}`, role: "system", text: action.text, verdict: action.verdict }] };
    case "error": return { ...state, phase: "answered", error: action.text };
    case "retry": return { ...state, phase: "idle", error: undefined };
    case "reset": return { phase: "idle", turns: [], followupUsed: false };
  }
}

function unknown(v: Verdict) { return v.startsWith("UNKNOWN"); }

export function DatasetBadge({ dataset }: { dataset: string }) {
  const meta = DATASETS.find((item) => item.id === dataset) ?? DATASETS[0];
  return <span className="dataset-badge">{meta.name} · {meta.version}</span>;
}

export function MessageBlock({ turn }: { turn: Turn }) {
  return <article className={`message-block ${turn.role}`}>
    <div className="message-role">{turn.role === "user" ? i18n.chat.you : i18n.chat.system}</div>
    <div className="message-content">{turn.text}</div>
    {turn.verdict && <div className="message-verdict">{turn.verdict}</div>}
  </article>;
}

export function Composer({ value, onChange, onSend, disabled, examples }: { value: string; onChange: (v: string) => void; onSend: () => void; disabled: boolean; examples?: string[] }) {
  return <div className="composer-wrap">
    {examples?.length ? <div className="example-list">{examples.map((example) => <button key={example} className="text-button example-button" onClick={() => onChange(example)}>{example}</button>)}</div> : null}
    <div className="composer-box">
      <textarea aria-label={i18n.chat.inputLabel} value={value} disabled={disabled} rows={2} placeholder={disabled ? i18n.chat.locked : i18n.chat.placeholder} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); onSend(); } }} />
      <button className="primary-button" onClick={onSend} disabled={disabled || !value.trim()} aria-label={i18n.chat.send}>{i18n.chat.send}</button>
    </div>
    <div className="composer-hint">{i18n.chat.keyboardHint}</div>
  </div>;
}

export function VerdictPanel({ item, dataset, runId, onClose }: { item?: Turn; dataset: string; runId: string; onClose: () => void }) {
  const json = JSON.stringify({ verdict: item?.verdict ?? null, explanation: item?.text ?? null, dataset, sessionId: runId, responseMs: item?.ms ?? null }, null, 2);
  return <aside className="verdict-panel">
    <div className="panel-heading"><h2>{i18n.chat.result}</h2><button className="text-button panel-close" onClick={onClose}>{i18n.chat.collapse}</button></div>
    <div className="panel-field"><span>{i18n.chat.verdict}</span><strong className="mono">{item?.verdict ?? "—"}</strong></div>
    <div className="panel-field"><span>{i18n.chat.dataset}</span><strong><DatasetBadge dataset={dataset} /></strong></div>
    <div className="panel-field"><span>{i18n.chat.responseTime}</span><strong className="mono">{item?.ms == null ? "—" : `${item.ms} ms`}</strong></div>
    <div className="panel-field"><span>{i18n.chat.sessionId}</span><strong className="mono">{runId}</strong></div>
    <div className="panel-actions"><button className="text-button" onClick={() => void navigator.clipboard?.writeText(json)}>{i18n.chat.copyJson}</button><button className="text-button" onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([json], { type: "application/json" })); a.download = `${runId}.json`; a.click(); URL.revokeObjectURL(a.href); }}>{i18n.chat.export}</button></div>
  </aside>;
}

export function AdvancedDrawer({ open, dataset, onDataset, onClose }: { open: boolean; dataset: string; onDataset: (v: string) => void; onClose: () => void }) {
  useEffect(() => { if (!open) return; const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); }, [open, onClose]);
  if (!open) return null;
  return <div className="drawer-backdrop" onMouseDown={onClose}><section className="advanced-drawer" role="dialog" aria-modal="true" aria-label={i18n.chat.advanced} onMouseDown={(e) => e.stopPropagation()}>
    <div className="panel-heading"><h2>{i18n.chat.advanced}</h2><button className="text-button" onClick={onClose}>{i18n.chat.close}</button></div>
    <label className="field-label" htmlFor="advanced-dataset">{i18n.chat.dataset}</label><select id="advanced-dataset" value={dataset} onChange={(e) => onDataset(e.target.value)}>{DATASETS.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.version}</option>)}</select>
    <p className="warning-note">{i18n.chat.datasetWarning}</p>
  </section></div>;
}

export function SessionBar({ dataset, runId, finished, onAdvanced, onNew, onShowResult, showResult }: { dataset: string; runId: string; finished: boolean; onAdvanced: () => void; onNew: () => void; onShowResult: () => void; showResult: boolean }) {
  return <header className="session-bar"><div><strong>{i18n.chat.title}</strong><div className="session-meta"><DatasetBadge dataset={dataset} /><span className="mono">{runId}</span></div></div><div className="session-actions">{!showResult && <button className="text-button" onClick={onShowResult}>{i18n.chat.showResult}</button>}<button className="text-button" onClick={onAdvanced}>{i18n.chat.advanced}</button>{finished && <button className="primary-button" onClick={onNew}>{i18n.chat.newSession}</button>}</div></header>;
}

export interface ChatTestbedProps { initialCaseId?: string; runId?: string }

export function ChatShell({ initialCaseId = "case_spec_fault", runId = "run_evalplus_01" }: ChatTestbedProps) {
  const [caseId, setCaseId] = useState(initialCaseId);
  const [dataset, setDataset] = useState<string>(DEFAULT_DATASET);
  const [state, dispatch] = useReducer(reducer, { phase: "idle", turns: [], followupUsed: false });
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{ id: string; title: string }[]>([]);
  const [panelOpen, setPanelOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const currentCase: CaseDossier = SAMPLE_CASES[caseId] ?? SAMPLE_CASES.case_spec_fault!;
  const stream = useDualOracleStream(runId);
  const latestResult = [...state.turns].reverse().find((turn) => turn.role === "system");
  const finished = state.phase === "final";
  const unknownResult = latestResult?.verdict ? unknown(latestResult.verdict) : false;
  const canAskFollowup = state.phase === "unknown_followup" && !state.followupUsed;

  useEffect(() => {
    if (!stream.isStreaming && stream.finalVerdict && state.phase === "asking") {
      dispatch({ type: "result", text: stream.streamedText || currentCase.adjudication.explanation, verdict: stream.finalVerdict, ms: stream.totalMs });
    }
  }, [stream.isStreaming, stream.finalVerdict, stream.streamedText, stream.totalMs, state.phase, currentCase.adjudication.explanation]);

  useEffect(() => {
    if (stream.error && !stream.isStreaming) dispatch({ type: "error", text: stream.error });
  }, [stream.error, stream.isStreaming]);

  const retry = async () => {
    const lastText = state.turns.at(-1)?.text ?? "";
    if (state.followupUsed && currentCase.ticket) {
      try {
        const response = await fetch(`/api/tickets/${currentCase.ticket.id}/answer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: lastText, durationMs: 0 }) });
        if (!response.ok) throw new Error(i18n.chat.retryError);
        const verdict: Verdict = currentCase.adjudication.verdict === "UNKNOWN_EVIDENCE" ? "ACC" : "SPEC_FAULT";
        dispatch({ type: "resolved", text: `${i18n.chat.followupRecorded}\n\n${currentCase.adjudication.explanation}`, verdict });
      } catch { dispatch({ type: "error", text: i18n.chat.retryError }); }
    } else {
      dispatch({ type: "retry" });
      stream.startStream(currentCase, lastText);
    }
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || stream.isStreaming || finished) return;
    setInput("");
    if (canAskFollowup && currentCase.ticket) {
      dispatch({ type: "followup", text, id: `u-${Date.now()}` });
      try {
        const response = await fetch(`/api/tickets/${currentCase.ticket.id}/answer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: text, durationMs: 0 }) });
        if (!response.ok) throw new Error(i18n.chat.retryError);
        const verdict: Verdict = currentCase.adjudication.verdict === "UNKNOWN_EVIDENCE" ? "ACC" : "SPEC_FAULT";
        dispatch({ type: "resolved", text: `${i18n.chat.followupRecorded}\n\n${currentCase.adjudication.explanation}`, verdict });
      } catch { dispatch({ type: "error", text: i18n.chat.retryError }); }
      return;
    }
    dispatch({ type: "send", text, id: `u-${Date.now()}` });
    setHistory((prev) => [{ id: `${Date.now()}`, title: text.slice(0, 64) }, ...prev]);
    stream.startStream(currentCase, text);
  }, [input, stream, finished, canAskFollowup, currentCase]);

  const newSession = () => { stream.stopStream(); dispatch({ type: "reset" }); setInput(""); setCaseId(Object.keys(SAMPLE_CASES)[(Object.keys(SAMPLE_CASES).indexOf(caseId) + 1) % Object.keys(SAMPLE_CASES).length] ?? initialCaseId); };
  const result = [...state.turns].reverse().find((turn) => turn.role === "system");
  const task = ACADEMIC_TASKS.find((entry) => entry.id === currentCase.taskId);
  return <div className="chat-shell">
    <aside className="session-sidebar"><div className="brand-row"><span className="brand-mark" aria-hidden="true" /> <strong>Adjudicator Lab</strong></div><button className="new-session" onClick={newSession}>{i18n.chat.newSession}</button><div className="history-title">{i18n.chat.recent}</div><div className="history-list">{history.length ? history.map((entry) => <div key={entry.id} className="history-item">{entry.title}</div>) : <p className="muted small">{i18n.chat.noHistory}</p>}</div><button className="text-button clear-history" onClick={() => setHistory([])}>{i18n.chat.clearHistory}</button></aside>
    <main className="chat-main"><SessionBar dataset={dataset} runId={runId} finished={finished} onAdvanced={() => setDrawerOpen(true)} onNew={newSession} onShowResult={() => setPanelOpen(true)} showResult={panelOpen} />
      <div className={`workspace ${panelOpen ? "with-panel" : ""}`}><section className="conversation" aria-live="polite"><div className="turn-status"><span>{state.phase === "idle" ? i18n.chat.turnOne : canAskFollowup ? i18n.chat.followupLeft : state.followupUsed ? i18n.chat.followupUsed : i18n.chat.turnOne}</span><span>{task?.name ?? currentCase.taskId} · {currentCase.id}</span></div>
        {!state.turns.length && <div className="empty-state"><p>{i18n.chat.emptyTitle}</p><div className="example-list">{i18n.chat.examples.map((example) => <button key={example} className="text-button example-button" onClick={() => setInput(example)}>{example}</button>)}</div></div>}
        {state.turns.map((turn) => <MessageBlock key={turn.id} turn={turn} />)}
        {stream.isStreaming && <div className="loading-line" role="status">{i18n.chat.loading}</div>}
        {state.error && <div className="error-box" role="alert">{state.error}<button className="text-button" onClick={() => void retry()}>{i18n.chat.retry}</button></div>}
        {unknownResult && canAskFollowup && <div className="neutral-note">{i18n.chat.unknownNotice}</div>}
        {finished && <div className="locked-note">{i18n.chat.sessionFinished}</div>}
        <Composer value={input} onChange={setInput} onSend={() => void send()} disabled={stream.isStreaming || finished || (state.followupUsed && !finished)} examples={state.turns.length ? undefined : []} />
      </section>{panelOpen && <VerdictPanel item={result} dataset={dataset} runId={runId} onClose={() => setPanelOpen(false)} />}</div>
    </main><AdvancedDrawer open={drawerOpen} dataset={dataset} onDataset={setDataset} onClose={() => setDrawerOpen(false)} />
  </div>;
}

export const ChatTestbed = ChatShell;
