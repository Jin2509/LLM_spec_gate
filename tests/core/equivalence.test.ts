import { describe, it, expect } from "vitest";
import { areEquivalent } from "@/core/equivalence";

describe("Strict Equivalence ≃ (areEquivalent)", () => {
  it("rejects different types even if loosely equal in JS", () => {
    expect(areEquivalent(1, "1").equal).toBe(false);
    expect(areEquivalent(0, false).equal).toBe(false);
    expect(areEquivalent(1, true).equal).toBe(false);
    expect(areEquivalent(null, undefined).equal).toBe(false);
  });

  it("handles strict integer equality", () => {
    expect(areEquivalent(42, 42).equal).toBe(true);
    expect(areEquivalent(42, 43).equal).toBe(false);
  });

  it("respects float tolerance epsilon", () => {
    // 0.1 + 0.2 = 0.30000000000000004
    expect(areEquivalent(0.1 + 0.2, 0.3, { epsilon: 1e-6 }).equal).toBe(true);
    expect(areEquivalent(0.1, 0.101, { epsilon: 1e-4 }).equal).toBe(false);
    expect(areEquivalent(0.1, 0.10001, { epsilon: 1e-4 }).equal).toBe(true);
  });

  it("compares arrays element-wise recursively", () => {
    expect(areEquivalent([1, 2, 3], [1, 2, 3]).equal).toBe(true);
    expect(areEquivalent([1, 2, 3], [1, 2, 4]).equal).toBe(false);
    expect(areEquivalent([1, [2, 3]], [1, [2, 3]]).equal).toBe(true);
    expect(areEquivalent([1, 2], [1, 2, 3]).equal).toBe(false);
  });

  it("compares objects key-by-key irrespective of key insertion order", () => {
    const a = { x: 1, y: "ok" };
    const b = { y: "ok", x: 1 };
    expect(areEquivalent(a, b).equal).toBe(true);
    expect(areEquivalent(a, { x: 1, y: "bad" }).equal).toBe(false);
  });

  it("handles string comparisons strictly", () => {
    expect(areEquivalent("hello\nworld", "hello\nworld").equal).toBe(true);
    expect(areEquivalent("hello", "Hello").equal).toBe(false);
  });
});
