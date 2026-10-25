/**
 * src/ui/layout — Khối bố cục dùng chung cho các màn hình feature.
 *
 * Gom các mẫu lặp lại (header trang, thẻ panel, ô số liệu, thông báo,
 * trạng thái tải/lỗi) để các page không phải nhân bản style inline.
 */
import { Construction, TriangleAlert } from "lucide-react";
import React from "react";

export type Tone = "neutral" | "success" | "warning" | "danger" | "action";

const TONE_VARS: Record<Tone, { fg: string; bg: string; border: string }> = {
  neutral: { fg: "var(--ink-soft)", bg: "var(--v-neutral-bg)", border: "var(--rule)" },
  success: { fg: "var(--v-acc)", bg: "var(--v-acc-bg)", border: "var(--v-acc)" },
  warning: { fg: "var(--v-spec)", bg: "var(--v-spec-bg)", border: "var(--v-spec)" },
  danger: { fg: "var(--v-code)", bg: "var(--v-code-bg)", border: "var(--v-code)" },
  action: { fg: "var(--action)", bg: "var(--paper-ground)", border: "var(--action)" },
};

export function toneStyle(tone: Tone): React.CSSProperties {
  const t = TONE_VARS[tone];
  return { color: t.fg, backgroundColor: t.bg, borderColor: t.border };
}

// ── PageHeader ──────────────────────────────────────────────────────────────
export interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  eyebrowTone?: Tone;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  testId?: string;
}

export function PageHeader({ eyebrow, eyebrowTone = "action", title, description, actions, testId }: PageHeaderProps) {
  return (
    <div
      data-testid={testId}
      className="p-4 rounded border flex flex-wrap items-center justify-between gap-4 font-mono text-xs"
      style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--rule)", borderRadius: "var(--r-card)" }}
    >
      <div>
        {eyebrow && (
          <span
            className="text-[11px] uppercase tracking-wider font-semibold"
            style={{ color: TONE_VARS[eyebrowTone].fg }}
          >
            {eyebrow}
          </span>
        )}
        <h1 className="text-base font-bold m-0 mt-0.5" style={{ color: "var(--ink)" }}>
          {title}
        </h1>
        {description && (
          <p className="text-[11px] m-0 mt-1 opacity-75" style={{ color: "var(--ink-soft)" }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

// ── Panel ───────────────────────────────────────────────────────────────────
export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  aside?: React.ReactNode;
  testId?: string;
}

export function Panel({ title, aside, testId, className = "", style, children, ...rest }: PanelProps) {
  return (
    <div
      data-testid={testId}
      className={`p-4 rounded border flex flex-col gap-4 font-mono text-xs ${className}`}
      style={{
        backgroundColor: "var(--paper-surface)",
        borderColor: "var(--rule)",
        borderRadius: "var(--r-card)",
        ...style,
      }}
      {...rest}
    >
      {(title || aside) && (
        <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--rule)" }}>
          <span className="font-semibold" style={{ color: "var(--ink)" }}>
            {title}
          </span>
          {aside && <span style={{ color: "var(--ink-soft)" }}>{aside}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

// ── MetricTile ──────────────────────────────────────────────────────────────
export interface MetricTileProps {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  valueColor?: string;
  borderColor?: string;
  valueTestId?: string;
}

export function MetricTile({ label, value, hint, valueColor = "var(--ink)", borderColor = "var(--rule)", valueTestId }: MetricTileProps) {
  return (
    <div className="p-2.5 rounded border" style={{ backgroundColor: "var(--paper-ground)", borderColor }}>
      <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>
        {label}
      </span>
      <strong data-testid={valueTestId} className="text-sm font-bold" style={{ color: valueColor }}>
        {value}
      </strong>
      {hint && (
        <div className="text-[10px] mt-0.5" style={{ color: "var(--ink-soft)" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// ── Notice ──────────────────────────────────────────────────────────────────
export interface NoticeProps {
  tone?: Tone;
  testId?: string;
  dashed?: boolean;
  children: React.ReactNode;
}

export function Notice({ tone = "neutral", testId, dashed, children }: NoticeProps) {
  return (
    <div
      data-testid={testId}
      role={tone === "danger" ? "alert" : "status"}
      className="p-3 rounded border font-mono text-xs"
      style={{ ...toneStyle(tone), borderStyle: dashed ? "dashed" : "solid", borderRadius: "var(--r-cell)" }}
    >
      {children}
    </div>
  );
}

// ── Badge ───────────────────────────────────────────────────────────────────
export function Badge({ tone = "neutral", children, className = "" }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`px-2 py-0.5 rounded border text-[11px] font-mono font-semibold ${className}`}
      style={{ ...toneStyle(tone), borderRadius: "var(--r-cell)" }}
    >
      {children}
    </span>
  );
}

// ── Query states ────────────────────────────────────────────────────────────
export function LoadingState({ label = "Đang tải dữ liệu..." }: { label?: string }) {
  return (
    <div role="status" className="p-6 text-center font-mono text-xs opacity-70" style={{ color: "var(--ink-soft)" }}>
      {label}
    </div>
  );
}

/**
 * Hiển thị lỗi API. Status 501 = backend chưa cấu hình engine cho chức năng này:
 * hiện trạng thái "chưa khả dụng" thay vì báo lỗi, và tuyệt đối không thay bằng số liệu giả.
 */
export function ErrorState({ message, onRetry, status }: { message: string; onRetry?: () => void; status?: number }) {
  const unavailable = status === 501;
  return (
    <div
      role="alert"
      data-testid={unavailable ? "feature-unavailable" : "error-state"}
      className="p-3 rounded border font-mono text-xs flex items-center justify-between gap-3"
      style={{ ...toneStyle(unavailable ? "warning" : "danger"), borderStyle: unavailable ? "dashed" : "solid", borderRadius: "var(--r-cell)" }}
    >
      <span>
        {unavailable ? (
          <>
            <Construction size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" /> <strong>Chức năng chưa khả dụng:</strong> {message}
          </>
        ) : (
          <><TriangleAlert size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" /> {message}</>
        )}
      </span>
      {onRetry && (
        <button type="button" className="underline cursor-pointer" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  );
}

/** Hiển thị loading/lỗi cho một query; chỉ render children khi đã có dữ liệu. */
export function QueryBoundary<T>({
  query,
  loadingLabel,
  children,
}: {
  query: { data: T | undefined; error: string | undefined; errorStatus?: number; isLoading: boolean; reload: () => void };
  loadingLabel?: string;
  children: (data: T) => React.ReactNode;
}) {
  if (query.data === undefined) {
    if (query.error) return <ErrorState message={query.error} status={query.errorStatus} onRetry={query.reload} />;
    return <LoadingState label={loadingLabel} />;
  }
  return (
    <>
      {query.error && <ErrorState message={query.error} status={query.errorStatus} onRetry={query.reload} />}
      {children(query.data)}
    </>
  );
}

export function PageFallback({ label }: { label: string }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center font-mono text-xs opacity-60"
      style={{ backgroundColor: "var(--paper-ground)", color: "var(--ink)" }}
    >
      {label}
    </div>
  );
}
