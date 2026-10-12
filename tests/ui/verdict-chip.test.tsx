import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { VerdictChip } from "@/ui/domain/VerdictChip";

describe("VerdictChip Component", () => {
  it("renders UNKNOWN_EVIDENCE with dashed border and symbol E", () => {
    render(<VerdictChip verdict="UNKNOWN_EVIDENCE" />);
    const chip = screen.getByTestId("verdict-chip");
    const symbol = screen.getByTestId("unknown-symbol");

    expect(chip.style.border).toContain("dashed");
    expect(chip.style.background).toBe("transparent");
    expect(symbol.textContent).toBe("E");
  });

  it("renders UNKNOWN_CONFLICT with dashed border and symbol C", () => {
    render(<VerdictChip verdict="UNKNOWN_CONFLICT" />);
    const chip = screen.getByTestId("verdict-chip");
    const symbol = screen.getByTestId("unknown-symbol");

    expect(chip.style.border).toContain("dashed");
    expect(chip.style.background).toBe("transparent");
    expect(symbol.textContent).toBe("C");
  });

  it("renders UNKNOWN_GATE with dashed border and symbol G", () => {
    render(<VerdictChip verdict="UNKNOWN_GATE" />);
    const chip = screen.getByTestId("verdict-chip");
    const symbol = screen.getByTestId("unknown-symbol");

    expect(chip.style.border).toContain("dashed");
    expect(chip.style.background).toBe("transparent");
    expect(symbol.textContent).toBe("G");
  });

  it("NEVER applies solid background to any UNKNOWN verdict", () => {
    const unknownVerdicts = [
      "UNKNOWN_EVIDENCE",
      "UNKNOWN_CONFLICT",
      "UNKNOWN_GATE",
    ] as const;

    for (const v of unknownVerdicts) {
      const { unmount } = render(<VerdictChip verdict={v} />);
      const chip = screen.getByTestId("verdict-chip");
      expect(chip.style.background).toBe("transparent");
      unmount();
    }
  });

  it("renders regular verdicts with solid border and solid tinted background", () => {
    render(<VerdictChip verdict="ACC" />);
    const chip = screen.getByTestId("verdict-chip");
    expect(chip.style.border).toContain("solid");
    expect(chip.style.background).toBe("var(--v-acc-bg)");
    expect(screen.queryByTestId("unknown-symbol")).toBeNull();
  });
});
