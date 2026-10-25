/**
 * src/features/runs/use-run-events.ts — Client Hook for Run SSE Events
 *
 * Requirements:
 *   - Server-Sent Events (SSE) với seq tăng dần và hỗ trợ Last-Event-ID.
 *   - Gộp batch 250ms để tối ưu hóa hiệu năng render.
 */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { RunEvent } from "@/lib/api/types";
import { api } from "@/lib/api/endpoints";

export interface UseRunEventsOptions {
  runId: string;
  batchIntervalMs?: number; // Mặc định 250ms
  initialEvents?: RunEvent[];
  autoConnect?: boolean;
}

export function useRunEvents({
  runId,
  batchIntervalMs = 250,
  initialEvents = [],
  autoConnect = true,
}: UseRunEventsOptions) {
  const [events, setEvents] = useState<RunEvent[]>(initialEvents);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bufferRef = useRef<RunEvent[]>([]);
  const lastSeqRef = useRef<number>(
    initialEvents.length > 0
      ? Math.max(...initialEvents.map((e) => e.seq))
      : 0
  );
  const eventSourceRef = useRef<EventSource | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Flush buffer to state
  const flushBuffer = useCallback(() => {
    if (bufferRef.current.length > 0) {
      const pending = [...bufferRef.current];
      bufferRef.current = [];
      setEvents((prev) => {
        // Prevent duplicate seq
        const existingSeqs = new Set(prev.map((e) => e.seq));
        const newEvents = pending.filter((e) => !existingSeqs.has(e.seq));
        return [...prev, ...newEvents].sort((a, b) => a.seq - b.seq);
      });
    }
  }, []);

  const connect = useCallback(() => {
    if (typeof window === "undefined" || !runId) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = api.runs.eventsUrl(runId, lastSeqRef.current);
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleMessage = (e: MessageEvent) => {
      try {
        const parsedData = JSON.parse(e.data);
        const seq = e.lastEventId ? parseInt(e.lastEventId, 10) : lastSeqRef.current + 1;
        lastSeqRef.current = Math.max(lastSeqRef.current, seq);

        const newEvent: RunEvent = {
          seq,
          event: (e.type || "admission_step") as RunEvent["event"],
          data: parsedData,
          timestamp: new Date().toISOString(),
        };

        bufferRef.current.push(newEvent);
      } catch (err) {
        console.error("Lỗi parse SSE message:", err);
      }
    };

    es.onmessage = handleMessage;
    // Also listen to specific custom event names
    es.addEventListener("run_created", handleMessage);
    es.addEventListener("admission_step", handleMessage);
    es.addEventListener("admission_completed", handleMessage);
    es.addEventListener("verdict", handleMessage);
    es.addEventListener("heldout_locked", handleMessage);

    es.onerror = () => {
      setIsConnected(false);
      setError("Mất kết nối stream SSE với máy chủ.");
      es.close();
    };
  }, [runId]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    flushBuffer();
  }, [flushBuffer]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Set batch timer (250ms)
    timerRef.current = setInterval(flushBuffer, batchIntervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      flushBuffer();
    };
  }, [autoConnect, connect, flushBuffer, batchIntervalMs]);

  const lastSeq = events.length > 0 ? Math.max(...events.map((e) => e.seq)) : 0;

  return {
    events,
    isConnected,
    error,
    lastSeq,
    connect,
    disconnect,
    flushBuffer,
  };
}
