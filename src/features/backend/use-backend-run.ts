/**
 * src/features/backend/use-backend-run.ts — Start a pipeline run on spec_gate_backend and follow it
 *
 * Requirements:
 *   - POST /api/backend/runs, then follow /api/backend/runs/{id}/events (SSE).
 *   - The backend closes the stream itself after run_done / run_failed; that close is not an error.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BACKEND_API,
  BACKEND_EVENT_NAMES,
  initialRunView,
  reduceRunEvent,
  type BackendRunManifest,
  type BackendRunView,
} from "./run-state";

export interface StartRunInput {
  seed: string;
  level: "A0" | "A1" | "A2" | "A3";
  taskIds: string[];
}

export function useBackendRun() {
  const [manifest, setManifest] = useState<BackendRunManifest | null>(null);
  const [view, setView] = useState<BackendRunView>(initialRunView);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);

  const close = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
  }, []);

  const refreshManifest = useCallback(async (runId: string) => {
    const res = await fetch(`${BACKEND_API}/runs/${encodeURIComponent(runId)}/manifest`);
    if (res.ok) setManifest((await res.json()) as BackendRunManifest);
  }, []);

  const follow = useCallback(
    (runId: string) => {
      close();
      const es = new EventSource(`${BACKEND_API}/runs/${encodeURIComponent(runId)}/events`);
      sourceRef.current = es;
      let finished = false;

      for (const name of BACKEND_EVENT_NAMES) {
        es.addEventListener(name, (e) => {
          const data = JSON.parse((e as MessageEvent<string>).data) as Record<string, unknown>;
          setView((prev) => reduceRunEvent(prev, name, data));
          if (name === "step_done" || name === "run_done" || name === "run_failed") {
            void refreshManifest(runId);
          }
          if (name === "run_done" || name === "run_failed") {
            finished = true;
            close();
          }
        });
      }
      es.onerror = () => {
        if (finished) return;
        // EventSource retries on its own; report it so a stopped backend is visible.
        setConnectionError("Mất kết nối SSE với backend, đang thử kết nối lại...");
      };
      es.onopen = () => setConnectionError(null);
    },
    [close, refreshManifest]
  );

  const start = useCallback(
    async (input: StartRunInput) => {
      setIsStarting(true);
      setConnectionError(null);
      setView(initialRunView());
      try {
        const res = await fetch(`${BACKEND_API}/runs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          setConnectionError(`Backend trả lỗi ${res.status}: ${await res.text()}`);
          return;
        }
        const created = (await res.json()) as BackendRunManifest;
        setManifest(created);
        follow(created.id);
      } catch (err) {
        setConnectionError(`Không gọi được backend: ${(err as Error).message}`);
      } finally {
        setIsStarting(false);
      }
    },
    [follow]
  );

  useEffect(() => close, [close]);

  return { manifest, view, connectionError, isStarting, start };
}

/** GET /api/backend/health: null while loading, false when the backend is unreachable. */
export function useBackendHealth() {
  const [health, setHealth] = useState<{ ok: boolean; adom: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BACKEND_API}/health`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { status: string; adom: boolean }) => {
        if (!cancelled) setHealth({ ok: d.status === "ok", adom: d.adom });
      })
      .catch(() => {
        if (!cancelled) setHealth({ ok: false, adom: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return health;
}
