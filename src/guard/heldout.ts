/**
 * src/guard/heldout.ts — Structural Held-Out Partition Guard
 *
 * Requirements:
 *   - The held-out split is strictly locked and immutable.
 *   - Any attempt to add/record a held-out witness into G or B throws HeldOutPartitionViolationError.
 *   - Seeded split partition guarantees reproducibility.
 */

export class HeldOutPartitionViolationError extends Error {
  constructor(witnessId: string, partition: "G" | "B") {
    super(
      `[heldout-guard] VI PHẠM AN TOÀN NGHIÊN CỨU: Witness "${witnessId}" thuộc tập held-out bị khóa cứng. Nghiêm cấm mọi thao tác ghi vào tập ${partition}.`
    );
    this.name = "HeldOutPartitionViolationError";
  }
}

class HeldOutRegistry {
  private locked = false;
  private heldOutSet = new Set<string>();
  private seed: string | null = null;

  /**
   * Locks the held-out partition with a specific random seed.
   * Can only be called once per run.
   */
  public lockPartition(witnessIds: Iterable<string>, seed: string): void {
    if (this.locked) {
      throw new Error("[heldout-guard] Tập held-out đã bị khóa trước đó. Không thể sửa đổi.");
    }
    this.heldOutSet = new Set(witnessIds);
    this.seed = seed;
    this.locked = true;
  }

  public isHeldOut(witnessId: string): boolean {
    return this.heldOutSet.has(witnessId);
  }

  public isLocked(): boolean {
    return this.locked;
  }

  public getSeed(): string | null {
    return this.seed;
  }

  /**
   * Asserts that a witness is NOT in the held-out partition before adding to G or B.
   */
  public assertCanWrite(witnessId: string, targetPartition: "G" | "B"): void {
    if (this.isHeldOut(witnessId)) {
      throw new HeldOutPartitionViolationError(witnessId, targetPartition);
    }
  }

  /**
   * Resets registry — for isolated test fixtures only.
   */
  public _resetForTesting(): void {
    this.locked = false;
    this.heldOutSet.clear();
    this.seed = null;
  }
}

export const heldOutRegistry = new HeldOutRegistry();
