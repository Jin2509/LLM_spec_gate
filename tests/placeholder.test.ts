/**
 * tests/placeholder.test.ts
 *
 * Smoke test — verifies the Vitest pipeline is functional.
 * Remove when real tests are added in S1+.
 */
import { describe, it, expect } from "vitest";

describe("Project scaffold smoke test", () => {
  it("environment is ready", () => {
    expect(true).toBe(true);
  });

  it("TypeScript strict mode is active (compile-time check)", () => {
    // This test verifies runtime — strict mode is verified by tsc --noEmit in check script
    const arr = [1, 2, 3];
    // With noUncheckedIndexedAccess, arr[0] is number | undefined
    const first = arr[0];
    expect(first).toBeDefined();
  });
});
