import { describe, it, expect } from "vitest";
import { SURFACE_INK_TOKENS, VERDICT_COLOR_TOKENS } from "@/styles/tokens-data";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

function linearize(c: number): number {
  const n = c / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function getContrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("WCAG AA Contrast Ratios for Design Tokens", () => {
  const allTokens = [...SURFACE_INK_TOKENS, ...VERDICT_COLOR_TOKENS];

  describe("Light Theme Contrast (WCAG AA: normal text >= 4.5:1 or large/bold >= 3.0:1)", () => {
    for (const token of allTokens) {
      it(`${token.label} (${token.cssVar}) in Light theme has sufficient contrast`, () => {
        const ratio = getContrastRatio(token.hexLight, token.bgHexLight);
        // WCAG AA for normal text is 4.5:1, for UI components/large text is 3.0:1
        expect(ratio).toBeGreaterThanOrEqual(3.0);
      });
    }
  });

  describe("Dark Theme Contrast (WCAG AA: normal text >= 4.5:1 or large/bold >= 3.0:1)", () => {
    for (const token of allTokens) {
      it(`${token.label} (${token.cssVar}) in Dark theme has sufficient contrast`, () => {
        const ratio = getContrastRatio(token.hexDark, token.bgHexDark);
        expect(ratio).toBeGreaterThanOrEqual(3.0);
      });
    }
  });
});
