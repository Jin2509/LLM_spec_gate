/**
 * Kiểm tra độ tương phản WCAG trực tiếp trên src/styles/tokens.css (công thức OKLCH).
 * Đọc token của light và dark, giải var(), đổi oklch → sRGB tuyến tính → độ chói tương đối.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.resolve(__dirname, "../../src/styles/tokens.css"), "utf8");

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`\n${selector} {`);
  if (start === -1) throw new Error(`Không thấy khối ${selector}`);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("\n}", start));
  const vars: Record<string, string> = {};
  for (const m of body.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[m[1]!] = m[2]!.trim();
  return vars;
}

const LIGHT = block(":root");
const DARK = { ...LIGHT, ...block(':root[data-theme="dark"]') };

function resolve(value: string, vars: Record<string, string>, depth = 0): string {
  if (depth > 20) throw new Error(`var() lồng quá sâu: ${value}`);
  const next = value.replace(/var\((--[\w-]+)\)/g, (_, name: string) => {
    if (!(name in vars)) throw new Error(`Thiếu biến ${name}`);
    return vars[name]!;
  });
  return next === value ? value : resolve(next, vars, depth + 1);
}

/** Độ chói tương đối (WCAG) của một màu oklch(L C H [/ a]) — alpha bị bỏ qua vì chỉ dùng cho màu đặc. */
function luminance(color: string): number {
  const m = color.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!m) throw new Error(`Không phải oklch: ${color}`);
  const [L, C, H] = [Number(m[1]), Number(m[2]), (Number(m[3]) * Math.PI) / 180];
  const a = C * Math.cos(H);
  const b = C * Math.sin(H);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  const r = clamp(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s);
  const g = clamp(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s);
  const bl = clamp(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

function contrast(fg: string, bg: string, vars: Record<string, string>): number {
  const [l1, l2] = [luminance(resolve(`var(${fg})`, vars)), luminance(resolve(`var(${bg})`, vars))];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// [chữ, nền, ngưỡng]: 4.5 cho chữ thường (WCAG AA).
const PAIRS: Array<[string, string, number]> = [
  ["--text-primary", "--bg-app", 4.5],
  ["--text-primary", "--bg-panel", 4.5],
  ["--text-secondary", "--bg-panel", 4.5],
  ["--text-muted", "--bg-app", 4.5],
  ["--text-muted", "--bg-panel", 4.5],
  ["--accent", "--bg-panel", 4.5],
  ["--accent", "--accent-soft", 4.5],
  ["--on-accent", "--accent", 4.5],
  ...(["acc", "spec", "code", "dual", "info"] as const).flatMap((v): Array<[string, string, number]> => [
    [`--v-${v}`, `--v-${v}-bg`, 4.5],
    [`--v-${v}`, "--bg-panel", 4.5],
  ]),
];

describe.each([
  ["light", LIGHT],
  ["dark", DARK],
] as const)("Tương phản WCAG AA của token (%s)", (_theme, vars) => {
  it.each(PAIRS)("%s trên %s ≥ %d:1", (fg, bg, min) => {
    expect(contrast(fg, bg, vars)).toBeGreaterThanOrEqual(min);
  });

  it("các màu phân xử có độ sáng cảm nhận bằng nhau (cùng tông OKLCH)", () => {
    const ls = ["acc", "spec", "code", "dual", "info"].map((v) => resolve(`var(--v-${v})`, vars).match(/oklch\(\s*([\d.]+)/)![1]);
    expect(new Set(ls).size).toBe(1);
  });
});
