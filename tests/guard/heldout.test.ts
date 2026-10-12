import { describe, it, expect, beforeEach } from "vitest";
import {
  heldOutRegistry,
  HeldOutPartitionViolationError,
} from "@/guard/heldout";

describe("Held-out Partition Guard (heldout.ts)", () => {
  beforeEach(() => {
    heldOutRegistry._resetForTesting();
  });

  it("locks partition once with a seed", () => {
    heldOutRegistry.lockPartition(["w_held_1", "w_held_2"], "seed_42");
    expect(heldOutRegistry.isLocked()).toBe(true);
    expect(heldOutRegistry.isHeldOut("w_held_1")).toBe(true);
    expect(heldOutRegistry.isHeldOut("w_train_1")).toBe(false);

    // Double locking must throw
    expect(() =>
      heldOutRegistry.lockPartition(["w_held_3"], "seed_43")
    ).toThrow();
  });

  it("THROWS HeldOutPartitionViolationError when attempting to write held-out witness into G or B", () => {
    heldOutRegistry.lockPartition(["w_secret_99"], "eval_seed");

    expect(() =>
      heldOutRegistry.assertCanWrite("w_secret_99", "G")
    ).toThrowError(HeldOutPartitionViolationError);

    expect(() =>
      heldOutRegistry.assertCanWrite("w_secret_99", "B")
    ).toThrowError(HeldOutPartitionViolationError);

    // Non-held-out witness is allowed
    expect(() =>
      heldOutRegistry.assertCanWrite("w_open_1", "G")
    ).not.toThrow();
  });
});
