/**
 * src/mock/runs.ts — Mock Runs, Partitioning & Admission Events Engine
 *
 * Requirements:
 *   - Deterministic Run / Held-out partition using PRNG seeded by string.
 *   - Immutable held-out locking via heldOutRegistry.
 *   - Monotonic SSE event sequence supporting Last-Event-ID replay.
 *   - Admission 6-step checklist evaluation.
 */
import { ACADEMIC_TASKS, type AcademicTask } from "./fixtures/academic-tasks";
import { heldOutRegistry } from "@/guard/heldout";
import { evaluateGate } from "@/core/gate";
import type { RepairCandidate, GateResult } from "@/core/types";
import {
  evaluateGatePolicy,
  determinePassMode,
  type GatePolicy,
  type PassMode,
} from "@/core/repair";
import {
  type MonitorVersionRecord,
  type BadTraceItem,
  checkTraceViolation,
  applyPatchRevocation,
} from "@/core/revocation";

export interface RunEvent {
  seq: number;
  event:
    | "run_created"
    | "admission_step"
    | "admission_completed"
    | "verdict"
    | "heldout_locked"
    | "repair_deployed"
    | "patch_revoked";
  data: Record<string, unknown>;
  timestamp: string;
}

export interface RunManifest {
  id: string;
  datasetId: string;
  seed: string;
  heldOutRatio: number;
  totalTasks: number;
  runTaskIds: string[];
  heldOutTaskIds: string[];
  isHeldOutLocked: boolean;
  activeMonitorVersion: string;
  createdAt: string;
}

// ── Deterministic PRNG from Seed ──────────────────────────────────────────

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

function mulberry32(a: number): () => number {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function partitionTasksDeterministically(
  tasks: readonly AcademicTask[],
  heldOutRatio: number,
  seed: string
): { runTasks: AcademicTask[]; heldOutTasks: AcademicTask[] } {
  const prng = mulberry32(hashSeed(seed));
  // Deterministic Fisher-Yates shuffle copy
  const shuffled = [...tasks];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const temp = shuffled[i];
    const target = shuffled[j];
    if (temp && target) {
      shuffled[i] = target;
      shuffled[j] = temp;
    }
  }

  const heldOutCount = Math.max(1, Math.round(shuffled.length * heldOutRatio));
  const heldOutTasks = shuffled.slice(0, heldOutCount);
  const runTasks = shuffled.slice(heldOutCount);

  return { runTasks, heldOutTasks };
}

// ── In-Memory Run Store ───────────────────────────────────────────────────

class MockRunStore {
  private runs = new Map<string, RunManifest>();
  private runEvents = new Map<string, RunEvent[]>();

  constructor() {
    // Initialize default reference run
    this.createRun({
      id: "run_evalplus_01",
      datasetId: "evalplus_illustrative",
      seed: "adjudicator_seed_42",
      heldOutRatio: 0.25,
    });
  }

  public createRun(params: {
    id?: string;
    datasetId: string;
    seed: string;
    heldOutRatio: number;
  }): RunManifest {
    const id = params.id || `run_${Date.now()}`;
    const { runTasks, heldOutTasks } = partitionTasksDeterministically(
      ACADEMIC_TASKS,
      params.heldOutRatio,
      params.seed
    );

    const manifest: RunManifest = {
      id,
      datasetId: params.datasetId,
      seed: params.seed,
      heldOutRatio: params.heldOutRatio,
      totalTasks: ACADEMIC_TASKS.length,
      runTaskIds: runTasks.map((t) => t.id),
      heldOutTaskIds: heldOutTasks.map((t) => t.id),
      isHeldOutLocked: false,
      activeMonitorVersion: "P_0",
      createdAt: new Date().toISOString(),
    };

    this.runs.set(id, manifest);

    // Seed default 6-step admission events
    const initialEvents: RunEvent[] = [
      {
        seq: 1,
        event: "run_created",
        data: {
          runId: id,
          totalTasks: manifest.totalTasks,
          runTasksCount: manifest.runTaskIds.length,
          heldOutTasksCount: manifest.heldOutTaskIds.length,
        },
        timestamp: new Date().toISOString(),
      },
      {
        seq: 2,
        event: "admission_step",
        data: {
          stepIndex: 1,
          stepKey: "static_checker",
          name: "Static Checker (AST & Type Check)",
          status: "passed",
          details: "12/12 task vượt qua kiểm tra tĩnh AST.",
        },
        timestamp: new Date().toISOString(),
      },
      {
        seq: 3,
        event: "admission_step",
        data: {
          stepIndex: 2,
          stepKey: "contract_runner",
          name: "Chạy Contract (Pre/Post-condition)",
          status: "passed",
          details: "Tất cả hợp đồng điều kiện tiền nghiệm/hậu nghiệm đều hợp lệ.",
        },
        timestamp: new Date().toISOString(),
      },
      {
        seq: 4,
        event: "admission_step",
        data: {
          stepIndex: 3,
          stepKey: "anchor_cross_check",
          name: "Kiểm chéo A2/A3 với Anchor Closure",
          status: "warning",
          violationCount: 1,
          violatedTaskId: "task_04",
          details:
            "Task 'find_valid_partition': Thuộc tính A2 mâu thuẫn với tập đóng anchor gốc.",
          actionRequired: "Đánh dấu để người kiểm lại",
        },
        timestamp: new Date().toISOString(),
      },
      {
        seq: 5,
        event: "admission_step",
        data: {
          stepIndex: 4,
          stepKey: "silent_fault_replay",
          name: "Replay đo SILENT_FAULT",
          status: "completed",
          silentFaultCount: 2,
          cases: ["case_spec_fault", "case_dual_fault"],
          details: "Phát hiện 2 ca SILENT_FAULT do monitor bỏ sót.",
        },
        timestamp: new Date().toISOString(),
      },
      {
        seq: 6,
        event: "admission_step",
        data: {
          stepIndex: 5,
          stepKey: "z3_property_verifier",
          name: "Z3 Kiểm tra A2",
          status: "passed",
          details: "Z3 Solver chứng minh tính thỏa mãn và bảo toàn của mệnh đề A2.",
        },
        timestamp: new Date().toISOString(),
      },
      {
        seq: 7,
        event: "admission_step",
        data: {
          stepIndex: 6,
          stepKey: "bsynth_slack_measurement",
          name: "Đo lỏng P0 qua B_synth",
          status: "completed",
          slackRatio: 16.7, // 16.7% slack
          details: "Độ lỏng monitor P_0: 16.7% (2/12 ca lọt qua $B_{synth}$).",
        },
        timestamp: new Date().toISOString(),
      },
      {
        seq: 8,
        event: "admission_completed",
        data: {
          runId: id,
          allStepsExecuted: true,
          status: "review_needed",
          summary: "Kiểm nạp hoàn tất. Có 1 ca vi phạm anchor cần con người thẩm định.",
        },
        timestamp: new Date().toISOString(),
      },
    ];

    this.runEvents.set(id, initialEvents);
    return manifest;
  }

  public getRun(id: string): RunManifest | undefined {
    return this.runs.get(id);
  }

  public lockHeldOut(id: string): { success: boolean; manifest?: RunManifest; error?: string } {
    const run = this.runs.get(id);
    if (!run) return { success: false, error: `Run "${id}" không tồn tại` };
    if (run.isHeldOutLocked) return { success: false, error: "Tập held-out đã bị khóa trước đó." };

    // Register into structural heldOutRegistry
    heldOutRegistry.lockPartition(run.heldOutTaskIds, run.seed);

    run.isHeldOutLocked = true;

    // Append lock event
    const events = this.runEvents.get(id) || [];
    const nextSeq = events.length > 0 ? Math.max(...events.map((e) => e.seq)) + 1 : 1;
    const lockEvent: RunEvent = {
      seq: nextSeq,
      event: "heldout_locked",
      data: {
        runId: id,
        seed: run.seed,
        heldOutTaskIds: run.heldOutTaskIds,
      },
      timestamp: new Date().toISOString(),
    };
    events.push(lockEvent);
    this.runEvents.set(id, events);

    return { success: true, manifest: run };
  }

  public getEvents(id: string, fromSeq = 0): RunEvent[] {
    const events = this.runEvents.get(id) || [];
    return events.filter((e) => e.seq > fromSeq);
  }

  public appendEvent(id: string, event: Omit<RunEvent, "seq" | "timestamp">): RunEvent {
    const events = this.runEvents.get(id) || [];
    const nextSeq = events.length > 0 ? Math.max(...events.map((e) => e.seq)) + 1 : 1;
    const fullEvent: RunEvent = {
      ...event,
      seq: nextSeq,
      timestamp: new Date().toISOString(),
    };
    events.push(fullEvent);
    this.runEvents.set(id, events);
    return fullEvent;
  }

  private monitorHistories = new Map<string, MonitorVersionRecord[]>();

  public deployRepair(
    caseId: string,
    repairCandidate: RepairCandidate,
    policy: GatePolicy = "standard",
    options: { isProofVerified?: boolean; hasA2Anchor?: boolean } = { isProofVerified: true, hasA2Anchor: true }
  ): {
    success: boolean;
    gateResult: GateResult;
    passMode?: PassMode;
    policyDecision: ReturnType<typeof evaluateGatePolicy>;
    nextMonitorVersion: string;
    isShadowOnly: boolean;
  } {
    // Evaluate G1-G5 gate
    const gateResult = evaluateGate(repairCandidate, {
      pPrimeAcceptsExpected: true,
      pPrimeRejectsB: true,
      localityHolds: true,
      preservesGAndA2: true,
      inRepairGrammar: true,
      rejectsBSynth: true,
      isProofVerified: options.isProofVerified ?? true,
    });

    const passMode = determinePassMode(gateResult, options);
    const policyDecision = evaluateGatePolicy(policy, gateResult, passMode);

    const run = this.runs.get("run_evalplus_01");
    let nextVersion = run ? run.activeMonitorVersion : "P_0";

    if (policyDecision.canDeploy && !policyDecision.isShadowOnly && run) {
      nextVersion = `P_${parseInt(run.activeMonitorVersion.replace("P_", ""), 10) + 1}`;
      run.activeMonitorVersion = nextVersion;

      const history = this.getMonitorHistory("run_evalplus_01");
      history.push({
        version: nextVersion,
        patchId: repairCandidate.id,
        guard: repairCandidate.guard,
        replacement: repairCandidate.replacement,
        status: "active",
        deployedAt: new Date().toISOString(),
      });
      this.monitorHistories.set("run_evalplus_01", history);

      this.appendEvent("run_evalplus_01", {
        event: "repair_deployed",
        data: {
          caseId,
          patchId: repairCandidate.id,
          version: nextVersion,
          policy,
          passMode,
        },
      });
    }

    return {
      success: policyDecision.canDeploy,
      gateResult,
      passMode,
      policyDecision,
      nextMonitorVersion: nextVersion,
      isShadowOnly: policyDecision.isShadowOnly,
    };
  }

  public getMonitorHistory(runId = "run_evalplus_01"): MonitorVersionRecord[] {
    let history = this.monitorHistories.get(runId);
    if (!history) {
      history = [
        {
          version: "P_0",
          status: "active",
          deployedAt: "2026-10-12T00:00:00Z",
        },
      ];
      this.monitorHistories.set(runId, history);
    }
    return [...history];
  }

  public injectBadTrace(
    runId = "run_evalplus_01",
    badTrace: BadTraceItem
  ): {
    revoked: boolean;
    violatingTrace?: BadTraceItem;
    reason?: string;
    newActiveVersion?: string;
  } {
    const history = this.getMonitorHistory(runId);
    const activeRecord = history.find((h) => h.status === "active") || history[history.length - 1]!;

    const check = checkTraceViolation(activeRecord, badTrace);
    if (!check.shouldRevoke) {
      return { revoked: false };
    }

    const { updatedHistory, newActiveVersion } = applyPatchRevocation(
      history,
      activeRecord.version,
      badTrace,
      new Date().toISOString()
    );

    this.monitorHistories.set(runId, updatedHistory);
    const run = this.runs.get(runId);
    if (run) {
      run.activeMonitorVersion = newActiveVersion.version;
    }

    this.appendEvent(runId, {
      event: "patch_revoked",
      data: {
        revokedVersion: activeRecord.version,
        newActiveVersion: newActiveVersion.version,
        violatingTraceId: badTrace.id,
        reason: check.reason,
      },
    });

    return {
      revoked: true,
      violatingTrace: badTrace,
      reason: check.reason,
      newActiveVersion: newActiveVersion.version,
    };
  }

  public _resetForTesting(): void {
    this.runs.clear();
    this.runEvents.clear();
    this.monitorHistories.clear();
    heldOutRegistry._resetForTesting();
    this.createRun({
      id: "run_evalplus_01",
      datasetId: "evalplus_illustrative",
      seed: "adjudicator_seed_42",
      heldOutRatio: 0.25,
    });
  }
}

export const mockRunStore = new MockRunStore();
