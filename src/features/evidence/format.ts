/**
 * src/ui/format.ts — Định dạng giá trị dữ liệu để HIỂN THỊ (không đổi dữ liệu gửi đi).
 *
 * Backend mã hoá tuple Python thành {"__tuple__": [...]}; hiển thị lại thành (a, b) cho dễ đọc.
 */
function isTuple(value: unknown): value is { __tuple__: unknown[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 1 &&
    Array.isArray((value as { __tuple__?: unknown }).__tuple__)
  );
}

export function formatValue(value: unknown): string {
  if (isTuple(value)) {
    const items = value.__tuple__.map(formatValue);
    return `(${items.join(", ")}${items.length === 1 ? "," : ""})`;
  }
  if (Array.isArray(value)) return `[${value.map(formatValue).join(", ")}]`;
  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value)
      .map(([k, v]) => `${JSON.stringify(k)}: ${formatValue(v)}`)
      .join(", ")}}`;
  }
  return value === undefined ? "—" : JSON.stringify(value);
}
