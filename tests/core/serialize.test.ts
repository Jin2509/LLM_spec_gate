import { describe, it, expect } from "vitest";
import { canonicalSerialize } from "@/core/serialize";

describe("Canonical Serializer (canonicalSerialize)", () => {
  it("sorts object keys lexicographically", () => {
    const obj = { z: 1, a: 2, m: 3 };
    const serialized = canonicalSerialize(obj);
    expect(serialized).toBe('{"a": 2, "m": 3, "z": 1}');
  });

  it("distinguishes int from float when requested", () => {
    expect(canonicalSerialize(10, { showTypeAnnotation: true })).toBe("10 (int)");
    expect(canonicalSerialize(10.5, { showTypeAnnotation: true })).toBe("10.5 (float)");
  });

  it("escapes control characters in strings", () => {
    expect(canonicalSerialize("hello\nworld\ttab")).toBe('"hello\\nworld\\ttab"');
  });

  it("truncates outputs exceeding maxLength", () => {
    const longString = "A".repeat(2500);
    const result = canonicalSerialize(longString);
    expect(result.length).toBeLessThan(2100);
    expect(result).toContain("[đã cắt bớt > 2000 ký tự]");
  });
});
