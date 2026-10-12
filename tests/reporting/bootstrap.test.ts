import { describe, it, expect } from "vitest";
import { calculateBootstrapCI } from "@/reporting/bootstrap";

describe("Bootstrap CI 95% Statistics Engine", () => {
  it("strictly returns status 'n_too_small' when n < 30", () => {
    const smallSample = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // n = 10 < 30
    const result = calculateBootstrapCI(smallSample, "test_seed");

    expect(result.status).toBe("n_too_small");
    expect(result.n).toBe(10);
    expect(result.message).toContain("quá nhỏ");
    expect(result.message).toContain("cấm vẽ spline làm mượt giả mạo");
  });

  it("calculates valid 95% confidence interval when n >= 30", () => {
    // Generate sample of 50 numbers
    const sample = Array.from({ length: 50 }, (_, i) => 10 + (i % 5));
    const result = calculateBootstrapCI(sample, "test_seed", 500);

    expect(result.status).toBe("ok");
    expect(result.n).toBe(50);
    expect(result.ciLower).toBeLessThanOrEqual(result.mean);
    expect(result.ciUpper).toBeGreaterThanOrEqual(result.mean);
  });

  it("produces deterministic CI bounds with the same seed", () => {
    const sample = Array.from({ length: 40 }, (_, i) => (i * 3) % 17);
    const run1 = calculateBootstrapCI(sample, "deterministic_seed_42", 500);
    const run2 = calculateBootstrapCI(sample, "deterministic_seed_42", 500);

    expect(run1.ciLower).toBe(run2.ciLower);
    expect(run1.ciUpper).toBe(run2.ciUpper);
    expect(run1.mean).toBe(run2.mean);
  });
});
