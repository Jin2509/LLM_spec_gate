/**
 * src/styles/tokens-data.ts
 *
 * Token definitions and metadata for documentation & contrast testing in Dev Kit.
 * Stored outside TSX components to satisfy:
 * "Không có mã màu HEX cứng nào nằm trong component TSX".
 */

export interface ColorTokenMeta {
  label: string;
  cssVar: string;
  hexLight: string;
  hexDark: string;
  bgHexLight: string;
  bgHexDark: string;
}

export const SURFACE_INK_TOKENS: readonly ColorTokenMeta[] = [
  {
    label: "Ink on Paper Ground",
    cssVar: "--ink",
    hexLight: "#16212B",
    hexDark: "#E3E9EE",
    bgHexLight: "#EDF0F2",
    bgHexDark: "#0F161C",
  },
  {
    label: "Ink on Paper Surface",
    cssVar: "--ink",
    hexLight: "#16212B",
    hexDark: "#E3E9EE",
    bgHexLight: "#F8F9FA",
    bgHexDark: "#17212A",
  },
  {
    label: "Ink Soft on Paper Ground",
    cssVar: "--ink-soft",
    hexLight: "#5B6A77",
    hexDark: "#9AA8B4",
    bgHexLight: "#EDF0F2",
    bgHexDark: "#0F161C",
  },
  {
    label: "Action on Paper Ground",
    cssVar: "--action",
    hexLight: "#2F4BC0",
    hexDark: "#7F95FF",
    bgHexLight: "#EDF0F2",
    bgHexDark: "#0F161C",
  },
] as const;

export const VERDICT_COLOR_TOKENS: readonly ColorTokenMeta[] = [
  {
    label: "ACC",
    cssVar: "--v-acc",
    hexLight: "#1F7A52",
    hexDark: "#4CC38A",
    bgHexLight: "#EAF6EF",
    bgHexDark: "#0D2A1A",
  },
  {
    label: "SPEC_ONLY",
    cssVar: "--v-spec",
    hexLight: "#B8780A",
    hexDark: "#E6A23C",
    bgHexLight: "#FEF5E6",
    bgHexDark: "#2A1C05",
  },
  {
    label: "CODE_ONLY",
    cssVar: "--v-code",
    hexLight: "#B83A2E",
    hexDark: "#F0766A",
    bgHexLight: "#FDECEA",
    bgHexDark: "#2A0E0C",
  },
  {
    label: "DUAL",
    cssVar: "--v-dual",
    hexLight: "#6B3A94",
    hexDark: "#B58AE0",
    bgHexLight: "#F3ECFB",
    bgHexDark: "#1E0E30",
  },
  {
    label: "NEUTRAL",
    cssVar: "--v-neutral",
    hexLight: "#5F6E7B",
    hexDark: "#7A8895",
    bgHexLight: "#F0F2F4",
    bgHexDark: "#1C2830",
  },
] as const;
