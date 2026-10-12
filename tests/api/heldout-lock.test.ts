/**
 * tests/api/heldout-lock.test.ts — Deterministic Run Partition & Immutable Held-out Lock Test
 *
 * Requirements:
 *   - Sau khi khóa held-out, không còn đường nào chỉnh sửa hay ghi đè.
 *   - Chia tỷ lệ Run/Held-out tất định bằng seed.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { POST as handleCreateRun } from "@/app/api/runs/route";
import { POST as handleLockHeldout } from "@/app/api/runs/[id]/lock-heldout/route";
import { GET as handleGetManifest } from "@/app/api/runs/[id]/manifest/route";
import { mockRunStore, partitionTasksDeterministically } from "@/mock/runs";
import { heldOutRegistry, HeldOutPartitionViolationError } from "@/guard/heldout";
import { ACADEMIC_TASKS } from "@/mock/fixtures/academic-tasks";
import { NextRequest } from "next/server";

describe("Deterministic Partition & Held-out Immutable Lock", () => {
  beforeEach(() => {
    mockRunStore._resetForTesting();
  });

  it("produces identical Run/Held-out split when given the same seed", () => {
    const split1 = partitionTasksDeterministically(ACADEMIC_TASKS, 0.25, "seed_alpha_123");
    const split2 = partitionTasksDeterministically(ACADEMIC_TASKS, 0.25, "seed_alpha_123");

    expect(split1.runTasks.map((t) => t.id)).toEqual(split2.runTasks.map((t) => t.id));
    expect(split1.heldOutTasks.map((t) => t.id)).toEqual(split2.heldOutTasks.map((t) => t.id));

    // Changing seed produces a different shuffle
    const splitDifferent = partitionTasksDeterministically(ACADEMIC_TASKS, 0.25, "seed_beta_999");
    expect(split1.runTasks.map((t) => t.id)).not.toEqual(splitDifferent.runTasks.map((t) => t.id));
  });

  it("POST /api/runs initializes a run and manifest reflects the partition", async () => {
    const req = new NextRequest("http://localhost:3000/api/runs", {
      method: "POST",
      body: JSON.stringify({
        datasetId: "evalplus_illustrative",
        seed: "test_seed_777",
        heldOutRatio: 0.3,
      }),
    });

    const res = await handleCreateRun(req);
    expect(res.status).toBe(201);
    const manifest = await res.json();

    expect(manifest.id).toBeDefined();
    expect(manifest.isHeldOutLocked).toBe(false);
    expect(manifest.runTaskIds.length + manifest.heldOutTaskIds.length).toBe(ACADEMIC_TASKS.length);
  });

  it("IMMUTABLE LOCK: once locked, rejects re-locking and structurally prevents writes to G/B", async () => {
    // 1. Lock the held-out partition
    const lockReq = new NextRequest("http://localhost:3000/api/runs/run_evalplus_01/lock-heldout", {
      method: "POST",
    });

    const lockRes = await handleLockHeldout(lockReq, {
      params: Promise.resolve({ id: "run_evalplus_01" }),
    });

    expect(lockRes.status).toBe(200);
    const lockData = await lockRes.json();
    expect(lockData.success).toBe(true);
    expect(lockData.manifest.isHeldOutLocked).toBe(true);

    // 2. Query manifest confirms lock state
    const manifestReq = new NextRequest("http://localhost:3000/api/runs/run_evalplus_01/manifest");
    const manifestRes = await handleGetManifest(manifestReq, {
      params: Promise.resolve({ id: "run_evalplus_01" }),
    });
    const manifest = await manifestRes.json();
    expect(manifest.isHeldOutLocked).toBe(true);

    // 3. Attempting to lock a second time is rejected
    const secondLockRes = await handleLockHeldout(lockReq, {
      params: Promise.resolve({ id: "run_evalplus_01" }),
    });
    expect(secondLockRes.status).toBe(400);

    // 4. Any attempt to write a held-out witness to G or B throws HeldOutPartitionViolationError
    const lockedWitness = manifest.heldOutTaskIds[0];
    expect(lockedWitness).toBeDefined();

    expect(() => {
      heldOutRegistry.assertCanWrite(lockedWitness, "G");
    }).toThrow(HeldOutPartitionViolationError);

    expect(() => {
      heldOutRegistry.assertCanWrite(lockedWitness, "B");
    }).toThrow(HeldOutPartitionViolationError);
  });
});
