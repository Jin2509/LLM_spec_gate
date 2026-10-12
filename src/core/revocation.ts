/**
 * src/core/revocation.ts — Pure Formal Patch Revocation Logic
 *
 * Implements monitor version lifecycle: P0 -> P1 -> ... -> Pk.
 * When a new bad trace t ∈ B enters guard region g of active monitor P_k,
 * G2 (Reject-B) is violated, triggering immediate patch revocation.
 *
 * ZERO React/Next/UI/Mock dependencies.
 */

export interface MonitorVersionRecord {
  readonly version: string; // e.g. "P_0", "P_1", "P_2"
  readonly patchId?: string;
  readonly guard?: string;
  readonly replacement?: string;
  readonly status: "active" | "revoked" | "deprecated";
  readonly deployedAt: string;
  readonly revokedAt?: string;
  readonly revocationReason?: string;
  readonly violatingTraceId?: string;
}

export interface BadTraceItem {
  readonly id: string;
  readonly input: unknown;
  readonly output: unknown;
  readonly inGuard: boolean;
  readonly description?: string;
  readonly injectedAt: string;
}

export interface RevocationCheckResult {
  readonly shouldRevoke: boolean;
  readonly violatingTrace?: BadTraceItem;
  readonly reason?: string;
  readonly nextVersion?: string;
}

/**
 * Checks whether an incoming bad trace enters the guard region of current active monitor.
 */
export function checkTraceViolation(
  activeMonitor: MonitorVersionRecord,
  badTrace: BadTraceItem
): RevocationCheckResult {
  if (activeMonitor.status !== "active") {
    return { shouldRevoke: false };
  }

  // If the bad trace is within the guard region g of this patch, G2 is violated!
  if (badTrace.inGuard) {
    const currentNum = parseInt(activeMonitor.version.replace("P_", ""), 10) || 0;
    const nextVersion = `P_${currentNum + 1}`;

    return {
      shouldRevoke: true,
      violatingTrace: badTrace,
      reason: `Vết xấu [${badTrace.id}] xâm phạm vùng bảo vệ g (${activeMonitor.guard ?? "cục bộ"}). Vi phạm tiên đề Gate G2: Reject-B. Bản vá ${activeMonitor.version} bị thu hồi ngay lập tức.`,
      nextVersion,
    };
  }

  return { shouldRevoke: false };
}

/**
 * Applies revocation: marks current version as revoked and produces new monitor version.
 */
export function applyPatchRevocation(
  history: ReadonlyArray<MonitorVersionRecord>,
  activeVersion: string,
  violatingTrace: BadTraceItem,
  timestamp: string
): {
  readonly updatedHistory: MonitorVersionRecord[];
  readonly newActiveVersion: MonitorVersionRecord;
} {
  const current = history.find((h) => h.version === activeVersion);
  const currentNum = current ? (parseInt(current.version.replace("P_", ""), 10) || 0) : 0;
  const newVerName = `P_${currentNum + 1}`;

  const updatedHistory: MonitorVersionRecord[] = history.map((record) => {
    if (record.version === activeVersion) {
      return {
        ...record,
        status: "revoked",
        revokedAt: timestamp,
        revocationReason: `Vết xấu [${violatingTrace.id}] xâm phạm vùng g. Vi phạm Gate G2.`,
        violatingTraceId: violatingTrace.id,
      };
    }
    return record;
  });

  const newActiveVersion: MonitorVersionRecord = {
    version: newVerName,
    status: "active",
    deployedAt: timestamp,
    revocationReason: undefined,
  };

  updatedHistory.push(newActiveVersion);

  return { updatedHistory, newActiveVersion };
}
