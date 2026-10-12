/**
 * src/core/equivalence.ts — Strict Value Equivalence ≃
 *
 * Implements strict equality for scientific adjudication:
 *   - Type-strict: bool ≠ int ≠ float (e.g. true ≠ 1, false ≠ 0)
 *   - Float tolerance: |a - b| ≤ ε (default 1e-6 if float detected or ε provided)
 *   - Deep structural recursion for arrays, tuples, and plain objects
 *   - Never relies on JS loose coercion (==)
 */

export interface EquivalenceOptions {
  /** Optional epsilon tolerance for floating-point comparisons */
  epsilon?: number;
}

export interface EquivalenceResult {
  equal: boolean;
  reason: string;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function areEquivalent(
  actual: unknown,
  expected: unknown,
  options?: EquivalenceOptions
): EquivalenceResult {
  // 1. Exact reference / primitive identity
  if (Object.is(actual, expected)) {
    return { equal: true, reason: "Đồng nhất tuyệt đối (Object.is)" };
  }

  // 2. Strict type check
  const typeActual = typeof actual;
  const typeExpected = typeof expected;

  if (typeActual !== typeExpected) {
    return {
      equal: false,
      reason: `Khác kiểu dữ liệu: ${typeActual} ≠ ${typeExpected}`,
    };
  }

  // 3. Null handling
  if (actual === null || expected === null) {
    if (actual !== expected) {
      return { equal: false, reason: "Một bên là null, bên kia khác null" };
    }
    return { equal: true, reason: "Đều là null" };
  }

  // 4. Boolean: must strictly match
  if (typeof actual === "boolean" && typeof expected === "boolean") {
    return actual === expected
      ? { equal: true, reason: "Giá trị boolean khớp" }
      : { equal: false, reason: `Boolean không khớp: ${actual} ≠ ${expected}` };
  }

  // 5. Numbers: differentiate int vs float, apply epsilon
  if (typeof actual === "number" && typeof expected === "number") {
    if (Number.isNaN(actual) || Number.isNaN(expected)) {
      return {
        equal: Number.isNaN(actual) && Number.isNaN(expected),
        reason: "Cả hai đều là NaN",
      };
    }

    const isActualInt = Number.isInteger(actual);
    const isExpectedInt = Number.isInteger(expected);
    const eps = options?.epsilon ?? 1e-6;

    // Both are integers: must be strictly equal
    if (isActualInt && isExpectedInt && options?.epsilon === undefined) {
      return actual === expected
        ? { equal: true, reason: "Số nguyên bằng nhau" }
        : { equal: false, reason: `Số nguyên khác nhau: ${actual} ≠ ${expected}` };
    }

    // Floating point comparison with epsilon
    const diff = Math.abs(actual - expected);
    if (diff <= eps) {
      return {
        equal: true,
        reason: `Số thực xấp xỉ trong dung sai ε=${eps} (|${actual} - ${expected}| = ${diff})`,
      };
    }
    return {
      equal: false,
      reason: `Vượt quá dung sai ε=${eps}: chênh lệch |${actual} - ${expected}| = ${diff}`,
    };
  }

  // 6. Strings
  if (typeof actual === "string" && typeof expected === "string") {
    return actual === expected
      ? { equal: true, reason: "Chuỗi ký tự khớp hoàn toàn" }
      : { equal: false, reason: "Chuỗi ký tự khác nhau" };
  }

  // 7. Arrays / Lists
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) {
      return {
        equal: false,
        reason: `Độ dài mảng khác nhau: ${actual.length} ≠ ${expected.length}`,
      };
    }

    for (let i = 0; i < actual.length; i++) {
      const itemRes = areEquivalent(actual[i], expected[i], options);
      if (!itemRes.equal) {
        return {
          equal: false,
          reason: `Khác tại phần tử [${i}]: ${itemRes.reason}`,
        };
      }
    }
    return { equal: true, reason: "Tất cả phần tử trong mảng khớp hoàn toàn" };
  }

  // If one is array and other is not
  if (Array.isArray(actual) !== Array.isArray(expected)) {
    return { equal: false, reason: "Một bên là mảng, một bên không phải" };
  }

  // 8. Objects
  if (isPlainObject(actual) && isPlainObject(expected)) {
    const keysActual = Object.keys(actual).sort();
    const keysExpected = Object.keys(expected).sort();

    if (keysActual.length !== keysExpected.length) {
      return {
        equal: false,
        reason: `Số lượng thuộc tính khác nhau: ${keysActual.length} ≠ ${keysExpected.length}`,
      };
    }

    for (let i = 0; i < keysActual.length; i++) {
      const keyA = keysActual[i];
      const keyB = keysExpected[i];
      if (keyA !== keyB) {
        return {
          equal: false,
          reason: `Khác biệt về thuộc tính: ${keyA} ≠ ${keyB}`,
        };
      }
      if (keyA !== undefined) {
        const propRes = areEquivalent(actual[keyA], expected[keyA], options);
        if (!propRes.equal) {
          return {
            equal: false,
            reason: `Thuộc tính "${keyA}" khác biệt: ${propRes.reason}`,
          };
        }
      }
    }
    return { equal: true, reason: "Mọi thuộc tính object đều khớp" };
  }

  return { equal: false, reason: "Kiểu dữ liệu không hỗ trợ so sánh ≃" };
}
