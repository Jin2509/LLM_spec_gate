/**
 * src/ui/layout — Khối bố cục dùng chung cho các màn hình feature.
 *
 * Gom các mẫu lặp lại (header trang, card, ô số liệu, thông báo, trạng thái tải/lỗi) để các page
 * không phải nhân bản style. Mọi màu lấy từ token (tokens.css); chữ dùng font sans, chỉ code/dữ liệu
 * mới dùng mono.
 */
import { ChevronRight, Construction, TriangleAlert } from "lucide-react";
import React from "react";

export type Tone = "neutral" | "success" | "warning" | "danger" | "action" | "info" | "dual";

const TONE_VARS: Record<Tone, { fg: string; bg: string; border: string }> = {
  neutral: { fg: "var(--text-secondary)", bg: "var(--bg-sunken)", border: "var(--border-default)" },
  success: { fg: "var(--v-acc)", bg: "var(--v-acc-bg)", border: "var(--v-acc-line)" },
  warning: { fg: "var(--v-spec)", bg: "var(--v-spec-bg)", border: "var(--v-spec-line)" },
  danger: { fg: "var(--v-code)", bg: "var(--v-code-bg)", border: "var(--v-code-line)" },
  action: { fg: "var(--accent)", bg: "var(--accent-soft)", border: "var(--accent-line)" },
  info: { fg: "var(--v-info)", bg: "var(--v-info-bg)", border: "var(--v-info-line)" },
  dual: { fg: "var(--v-dual)", bg: "var(--v-dual-bg)", border: "var(--v-dual-line)" },
};

export function toneStyle(tone: Tone): React.CSSProperties {
  const t = TONE_VARS[tone];
  return { color: t.fg, backgroundColor: t.bg, borderColor: t.border };
}

// ── PageHeader ──────────────────────────────────────────────────────────────
export interface PageHeaderProps {
  /** Nhãn nhỏ phía trên tiêu đề, ví dụ "Bước 2 · Kiểm nạp". */
  eyebrow?: React.ReactNode;
  eyebrowTone?: Tone;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  testId?: string;
}

export function PageHeader({ eyebrow, eyebrowTone = "action", title, description, actions, testId }: PageHeaderProps) {
  return (
    <header data-testid={testId} className="flex flex-wrap items-end justify-between gap-4 pb-1">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && (
          <span className="block text-[12px] font-medium tracking-wide" style={{ color: TONE_VARS[eyebrowTone].fg }}>
            {eyebrow}
          </span>
        )}
        <h1 className="m-0 mt-1 text-[22px] leading-tight font-semibold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
          {title}
        </h1>
        {description && (
          <p className="m-0 mt-1.5 text-[14px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
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
    <section
      data-testid={testId}
      className={`p-5 rounded-[var(--radius-md)] border flex flex-col gap-4 text-[13.5px] ${className}`}
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderColor: "var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
        ...style,
      }}
      {...rest}
    >
      {(title || aside) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
            {title}
          </h2>
          {aside && (
            <span className="text-[12.5px]" style={{ color: "var(--ink-soft)" }}>
              {aside}
            </span>
          )}
        </div>
      )}
      {children}
    </section>
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

export function MetricTile({ label, value, hint, valueColor = "var(--ink)", borderColor = "var(--border-subtle)", valueTestId }: MetricTileProps) {
  return (
    <div
      className="p-4 rounded-[var(--radius-md)] border flex flex-col gap-1"
      style={{ backgroundColor: "var(--bg-elevated)", borderColor, boxShadow: "var(--shadow-sm)" }}
    >
      <span className="text-[12.5px]" style={{ color: "var(--ink-soft)" }}>
        {label}
      </span>
      <strong data-testid={valueTestId} className="text-[22px] leading-tight font-semibold tabular-nums" style={{ color: valueColor }}>
        {value}
      </strong>
      {hint && (
        <span className="text-[12px]" style={{ color: "var(--ink-soft)" }}>
          {hint}
        </span>
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
      className="px-4 py-3 rounded-[var(--radius-md)] border text-[13.5px] leading-relaxed"
      style={{ ...toneStyle(tone), borderStyle: dashed ? "dashed" : "solid" }}
    >
      {children}
    </div>
  );
}

// ── Badge ───────────────────────────────────────────────────────────────────
export function Badge({ tone = "neutral", children, className = "" }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[12px] font-medium whitespace-nowrap ${className}`}
      style={toneStyle(tone)}
    >
      {children}
    </span>
  );
}

// ── TechDetails ─────────────────────────────────────────────────────────────
/** Khối thu gọn cho chi tiết kỹ thuật (thuật ngữ bài báo, mã, dữ liệu thô): mặc định ẩn để UI gọn. */
export function TechDetails({ summary = "Chi tiết kỹ thuật", children, testId }: { summary?: React.ReactNode; children: React.ReactNode; testId?: string }) {
  return (
    <details data-testid={testId} className="group text-[13px]">
      <summary
        className="inline-flex items-center gap-1 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden"
        style={{ color: "var(--ink-soft)" }}
      >
        <ChevronRight size={14} className="transition-transform group-open:rotate-90" aria-hidden="true" />
        {summary}
      </summary>
      <div className="mt-2 pl-5">{children}</div>
    </details>
  );
}

// ── Query states ────────────────────────────────────────────────────────────
function LoadingState({ label = "Đang tải dữ liệu..." }: { label?: string }) {
  return (
    <div role="status" className="p-8 text-center text-[13.5px]" style={{ color: "var(--ink-soft)" }}>
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
  const Icon = unavailable ? Construction : TriangleAlert;
  return (
    <div
      role="alert"
      data-testid={unavailable ? "feature-unavailable" : "error-state"}
      className="px-4 py-3 rounded-[var(--radius-md)] border text-[13.5px] flex items-start justify-between gap-3"
      style={{ ...toneStyle(unavailable ? "warning" : "danger"), borderStyle: unavailable ? "dashed" : "solid" }}
    >
      <span className="flex items-start gap-2">
        <Icon size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          {unavailable && <strong>Chức năng chưa khả dụng: </strong>}
          {message}
        </span>
      </span>
      {onRetry && (
        <button type="button" className="shrink-0 font-medium underline underline-offset-2 cursor-pointer" onClick={onRetry}>
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
      className="min-h-screen flex items-center justify-center text-[13.5px]"
      style={{ backgroundColor: "var(--paper-ground)", color: "var(--ink-soft)" }}
    >
      {label}
    </div>
  );
}
