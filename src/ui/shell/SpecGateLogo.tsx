/**
 * src/ui/shell/SpecGateLogo.tsx — Logo SpecGate (cùng hình với src/app/icon.svg, màu theo token --accent).
 */
export function SpecGateLogo({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="7" fill="var(--accent)" />
      <path d="M9 25V13a7 7 0 0 1 14 0v12" fill="none" stroke="var(--on-accent)" strokeWidth="2.6" strokeLinecap="round" />
      <path
        d="M12.5 18.2l2.6 2.6 4.6-5.2"
        fill="none"
        stroke="var(--on-accent)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
