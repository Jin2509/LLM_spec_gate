"use client";

import { useEffect, useState } from "react";
import type { ExperimentConfig } from "@/core/experiment";
import { api, toDisplayError, type DisplayError, type ExperimentStatusResponse } from "@/lib/api";

const POLL_MS = 500;

/** Khởi chạy batch qua API và poll tiến độ tới khi hoàn tất. */
export function useBatchRun() {
  const [status, setStatus] = useState<ExperimentStatusResponse | null>(null);
  const [error, setError] = useState<DisplayError | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const experimentId = status?.status === "running" ? status.experimentId : null;

  useEffect(() => {
    if (!experimentId) return;
    const timer = window.setInterval(() => {
      api.experiments.status(experimentId).then(setStatus, (e: unknown) => setError(toDisplayError(e)));
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [experimentId]);

  const start = async (config: ExperimentConfig) => {
    setIsStarting(true);
    setError(null);
    try {
      setStatus(await api.experiments.start(config));
    } catch (e) {
      setError(toDisplayError(e));
    } finally {
      setIsStarting(false);
    }
  };

  return { status, error, isRunning: isStarting || status?.status === "running", start };
}
