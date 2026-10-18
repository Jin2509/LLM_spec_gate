import type { Metrics, Run } from "./evaluation-types";

export function calculateRunMetrics(runs: readonly Run[]): Metrics {
  const byVerdict: Record<string, number> = { CODE_FAULT: 0, SPEC_FAULT: 0, UNKNOWN: 0 };
  const labeled = runs.filter((run) => run.gold_label && run.verdicts.length);
  const latencies = runs.flatMap((run) => Object.values(run.latency)).filter(Number.isFinite).sort((a, b) => a - b);
  const confidences = runs.flatMap((run) => run.confidence == null ? [] : [run.confidence]);
  const unknownRuns = runs.filter((run) => run.verdicts.some((verdict) => String(verdict).startsWith("UNKNOWN")));
  for (const run of runs) {
    const verdict = String(run.verdicts.at(-1) ?? "");
    if (verdict.startsWith("UNKNOWN")) byVerdict.UNKNOWN = (byVerdict.UNKNOWN ?? 0) + 1;
    else if (verdict in byVerdict) byVerdict[verdict] = (byVerdict[verdict] ?? 0) + 1;
  }
  const mean = latencies.length ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : undefined;
  const percentile = (p: number) => latencies.length ? latencies[Math.ceil(p * latencies.length) - 1] : undefined;
  return {
    totalRuns: runs.length, byVerdict,
    accuracy: labeled.length ? labeled.filter((run) => run.verdicts.at(-1) === run.gold_label).length / labeled.length : undefined,
    averageConfidence: confidences.length ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length : undefined,
    latency: { mean, p50: percentile(.5), p95: percentile(.95) },
    followupsUsed: runs.filter((run) => run.turns.filter((turn) => turn.role === "user").length > 1).length,
    unknownResolvedRate: unknownRuns.length ? unknownRuns.filter((run) => !String(run.verdicts.at(-1) ?? "").startsWith("UNKNOWN")).length / unknownRuns.length : undefined,
  };
}
