/**
 * src/core/serialize.ts — Canonical Deterministic Value Serializer
 *
 * Requirements (Playbook Section 8.1):
 *   1. Keys in objects sorted alphabetically; undefined omitted; NaN, ±Infinity explicit.
 *   2. Numbers: distinguishes int vs float (e.g. "1 (int)" vs "1.0 (float)").
 *   3. Strings: quoted, control chars escaped (\n, \t, \r, \u00a0).
 *   4. Max length cutoff (2000 chars) with truncation notice.
 *   5. Deterministic output on all platforms.
 */

export interface SerializeOptions {
  maxLength?: number;
  showTypeAnnotation?: boolean;
}

export function canonicalSerialize(
  value: unknown,
  options?: SerializeOptions
): string {
  const maxLen = options?.maxLength ?? 2000;
  const showType = options?.showTypeAnnotation ?? false;

  const raw = formatValue(value, showType);
  if (raw.length > maxLen) {
    return raw.slice(0, maxLen) + " ... [đã cắt bớt > 2000 ký tự]";
  }
  return raw;
}

function escapeString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\u00a0/g, "\\u00a0");
}

function formatValue(v: unknown, showType: boolean): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";

  if (typeof v === "boolean") {
    return v ? "true" : "false";
  }

  if (typeof v === "number") {
    if (Number.isNaN(v)) return "NaN";
    if (v === Infinity) return "+Infinity";
    if (v === -Infinity) return "-Infinity";

    if (Number.isInteger(v)) {
      return showType ? `${v} (int)` : String(v);
    }
    // Float representation with at least one decimal digit
    const formatted = v.toString();
    const withDot = formatted.includes(".") ? formatted : `${formatted}.0`;
    return showType ? `${withDot} (float)` : withDot;
  }

  if (typeof v === "string") {
    return `"${escapeString(v)}"`;
  }

  if (Array.isArray(v)) {
    const items = v.map((item) => formatValue(item, showType));
    return `[${items.join(", ")}]`;
  }

  if (typeof v === "object") {
    const keys = Object.keys(v as object).sort();
    const pairs: string[] = [];
    for (const k of keys) {
      const val = (v as Record<string, unknown>)[k];
      if (val !== undefined) {
        pairs.push(`"${escapeString(k)}": ${formatValue(val, showType)}`);
      }
    }
    return `{${pairs.join(", ")}}`;
  }

  return String(v);
}
