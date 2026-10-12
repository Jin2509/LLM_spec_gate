/**
 * src/reporting/bootstrap.ts — Seeded 95% Bootstrap Confidence Interval
 *
 * Requirements:
 *   - Deterministic PRNG initialized with string seed.
 *   - Generates 1,000 resamples with replacement.
 *   - Threshold check: if n < 30, returns status "n_too_small" and forbids spline smoothing.
 *
 * ZERO UI / React / Next dependencies.
 */

export interface BootstrapResult {
  readonly status: "ok" | "n_too_small";
  readonly n: number;
  readonly mean: number;
  readonly ciLower: number; // 2.5th percentile
  readonly ciUpper: number; // 97.5th percentile
  readonly message?: string;
}

// Deterministic PRNG from string seed (mulberry32)
function createSeededRandom(seedStr: string): () => number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  let s = h >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Calculates 95% Bootstrap Confidence Interval on array of numerical metrics.
 * Resamples B = 1,000 times deterministically.
 */
export function calculateBootstrapCI(
  data: ReadonlyArray<number>,
  seed = "bootstrap_seed_v14",
  iterations = 1000
): BootstrapResult {
  const n = data.length;

  if (n === 0) {
    return {
      status: "n_too_small",
      n: 0,
      mean: 0,
      ciLower: 0,
      ciUpper: 0,
      message: "Tập dữ liệu rỗng (n = 0).",
    };
  }

  const rawMean = data.reduce((acc, v) => acc + v, 0) / n;

  // Scientific Rigor Rule: If n < 30, strictly return "n_too_small"
  if (n < 30) {
    return {
      status: "n_too_small",
      n,
      mean: rawMean,
      ciLower: rawMean,
      ciUpper: rawMean,
      message: `Cỡ mẫu n = ${n} quá nhỏ (ngưỡng tối thiểu n ≥ 30). Không thể suy diễn khoảng tin cậy và cấm vẽ spline làm mượt giả mạo.`,
    };
  }

  const random = createSeededRandom(seed);
  const bootstrapMeans: number[] = new Array(iterations);

  for (let i = 0; i < iterations; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      const idx = Math.floor(random() * n);
      sum += data[idx]!;
    }
    bootstrapMeans[i] = sum / n;
  }

  bootstrapMeans.sort((a, b) => a - b);

  // 95% interval: 2.5% and 97.5% quantiles
  const lowerIdx = Math.floor(iterations * 0.025);
  const upperIdx = Math.floor(iterations * 0.975);

  return {
    status: "ok",
    n,
    mean: Number(rawMean.toFixed(4)),
    ciLower: Number((bootstrapMeans[lowerIdx] ?? rawMean).toFixed(4)),
    ciUpper: Number((bootstrapMeans[upperIdx] ?? rawMean).toFixed(4)),
  };
}
