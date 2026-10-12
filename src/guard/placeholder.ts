/**
 * Module B — Guard Layer (src/guard/)
 *
 * PURPOSE: Data isolation and access control for evaluation artifacts.
 *
 * CONTAINS (to be implemented in S2+):
 *   - grading-proxy.ts    — SOLE gateway to .grading field (already implemented)
 *   - held-out-lock.ts    — Structural lock on held-out partition; blocks all writes
 *                           outside authorized evaluation windows
 *   - evidence-store.ts   — G ∩ B = ∅ invariant enforcement; InvariantBar metrics
 *
 * INVARIANTS:
 *   ✗ No file outside this module may access .grading (ESLint enforced)
 *   ✗ held-out partition is read-only to all non-guard code
 *   ✓ GradingAccessError thrown on unauthorized access attempt
 */

export {}; // Placeholder
