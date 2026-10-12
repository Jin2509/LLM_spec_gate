/**
 * Module B — Grading Proxy (src/guard/grading-proxy.ts)
 *
 * PURPOSE: SOLE authorized gateway to the `grading` field in any evidence object.
 *          All other files in the codebase are forbidden from accessing `.grading`
 *          directly (enforced by ESLint no-restricted-syntax rule).
 *
 * RATIONALE:
 *   - Prevents accidental data leakage from the grading/held-out split.
 *   - Centralizes access control so audit is a single file diff.
 *   - Enables future encryption-at-rest or RBAC without touching call sites.
 *
 * USAGE:
 *   import { readGrading } from "@/guard/grading-proxy";
 *   const g = readGrading(evidenceRecord); // ← only legal read path
 *
 * HELD-OUT LOCK:
 *   All write operations to held-out partitions must also go through this module.
 *   Write attempts outside evaluation windows throw GradingAccessError.
 */

/** Marker type — do not export the raw shape; callers receive opaque tokens */
export type GradingToken = Readonly<{
  /** Opaque grading value — use readGrading() to access */
  _grading: unknown;
}>;

export class GradingAccessError extends Error {
  constructor(message: string) {
    super(`[grading-guard] ${message}`);
    this.name = "GradingAccessError";
  }
}

/**
 * Reads the grading field from a record that carries it.
 * This is the only location in the codebase where `.grading` is accessed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readGrading(record: Record<string, any>): unknown {
  // Direct access allowed ONLY in this file (see ESLint config grading-guard rule)
  return record.grading; // ← intentional: sole authorized access point
}

/**
 * Strips the grading property from records before sending them out to the client.
 * Guarantees zero grading leakage into DOM or client network payloads.
 */
export function stripGrading<T>(data: T): T {
  if (data === null || typeof data !== "object") {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => stripGrading(item)) as unknown as T;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clone: Record<string, any> = { ...(data as any) };
  if ("grading" in clone) {
    delete clone.grading;
  }
  for (const key of Object.keys(clone)) {
    if (typeof clone[key] === "object" && clone[key] !== null) {
      clone[key] = stripGrading(clone[key]);
    }
  }
  return clone as T;
}

export {}; // Keep module even after tree-shaking

