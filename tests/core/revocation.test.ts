import { describe, it, expect } from "vitest";
import {
  checkTraceViolation,
  applyPatchRevocation,
  type MonitorVersionRecord,
  type BadTraceItem,
} from "@/core/revocation";

describe("Patch Revocation Core Logic", () => {
  const activeMonitorP1: MonitorVersionRecord = {
    version: "P_1",
    patchId: "rep_spec_1",
    guard: "len(w) == 4",
    replacement: "ret[0] <= ret[2]",
    status: "active",
    deployedAt: "2026-10-12T00:00:00Z",
  };

  it("triggers revocation when a new bad trace enters guard g", () => {
    const violatingTrace: BadTraceItem = {
      id: "bad_01",
      input: [5, 3, 2, 8],
      output: [8, 5, 3, 2],
      inGuard: true, // Bad trace inside guard g!
      injectedAt: "2026-10-12T01:00:00Z",
    };

    const result = checkTraceViolation(activeMonitorP1, violatingTrace);
    expect(result.shouldRevoke).toBe(true);
    expect(result.violatingTrace?.id).toBe("bad_01");
    expect(result.nextVersion).toBe("P_2");
    expect(result.reason).toContain("Gate G2: Reject-B");
  });

  it("does not trigger revocation when bad trace is outside guard g", () => {
    const outsideTrace: BadTraceItem = {
      id: "bad_outside",
      input: [1, 2, 3], // len != 4
      output: [3, 2, 1],
      inGuard: false,
      injectedAt: "2026-10-12T01:00:00Z",
    };

    const result = checkTraceViolation(activeMonitorP1, outsideTrace);
    expect(result.shouldRevoke).toBe(false);
  });

  it("applies revocation: sets status to revoked and rolls forward to new active version", () => {
    const violatingTrace: BadTraceItem = {
      id: "bad_02",
      input: [4, 2, 1, 9],
      output: [9, 1, 2, 4],
      inGuard: true,
      injectedAt: "2026-10-12T02:00:00Z",
    };

    const history: MonitorVersionRecord[] = [
      { version: "P_0", status: "deprecated", deployedAt: "2026-10-12T00:00:00Z" },
      activeMonitorP1,
    ];

    const { updatedHistory, newActiveVersion } = applyPatchRevocation(
      history,
      "P_1",
      violatingTrace,
      "2026-10-12T02:01:00Z"
    );

    const revokedP1 = updatedHistory.find((h) => h.version === "P_1");
    expect(revokedP1?.status).toBe("revoked");
    expect(revokedP1?.violatingTraceId).toBe("bad_02");

    expect(newActiveVersion.version).toBe("P_2");
    expect(newActiveVersion.status).toBe("active");
  });
});
