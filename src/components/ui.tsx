import type { ReactNode } from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ shell */

export function Card({
  children,
  className,
  title,
  subtitle,
  action,
}: {
  children?: ReactNode;
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={cx("surface rounded-card border hairline", className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b hairline px-4 py-3 sm:px-5">
          <div>
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {subtitle && <p className="dim mt-0.5 text-xs">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
        {subtitle && <p className="dim mt-1 text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* --------------------------------------------------------------- stat tile */

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "brand";
}) {
  // Green is reserved for positive/brand; everything else stays neutral ink.
  const tones: Record<string, string> = {
    neutral: "text-ink-950",
    brand: "text-green-700",
    good: "text-green-700",
    warn: "text-ink-950",
    bad: "text-[color:var(--color-danger)]",
  };
  return (
    <div className="surface rounded-card border hairline p-4">
      <p className="dim text-xs font-medium">{label}</p>
      <p className={cx("mt-1.5 text-2xl font-bold tabular-nums", tones[tone])}>{value}</p>
      {hint && <p className="dim mt-1 text-xs">{hint}</p>}
    </div>
  );
}

export function StatGrid({ children, cols = 4 }: { children: ReactNode; cols?: 3 | 4 | 5 }) {
  const map = {
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-2 lg:grid-cols-5",
  } as const;
  return <div className={cx("grid grid-cols-1 gap-3", map[cols])}>{children}</div>;
}

/* ------------------------------------------------------------------ badges */

export type BadgeTone = "neutral" | "brand" | "good" | "warn" | "bad" | "info" | "muted";

/**
 * Only two colour families exist: green for positive/brand, red for genuine
 * failure. "warn" and "info" are deliberately neutral — inventing amber and
 * blue would break the three-colour brand rule.
 */
const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-ink-100 text-ink-900",
  muted: "bg-ink-100 text-ink-500",
  brand: "bg-green-50 text-green-700",
  good: "bg-green-50 text-green-700",
  info: "bg-ink-100 text-ink-900",
  warn: "bg-ink-950 text-white",
  bad: "bg-[color:var(--color-danger)] text-white",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        BADGE_TONES[tone]
      )}
    >
      {children}
    </span>
  );
}

export function toneForStatus(status: string): BadgeTone {
  switch (status) {
    case "BOOKED":
    case "DONE":
    case "PAID":
    case "RESOLVED":
    case "CLOSED":
    case "COMPLETED":
    case "HANDED_OVER":
    case "SOLD":
      return "good";
    case "INTERESTED":
    case "NEGOTIATION":
    case "IN_PROGRESS":
    case "ASSIGNED":
    case "ACTIVE":
      return "brand";
    case "SITE_VISITED":
    case "SITE_VISIT_SCHEDULED":
    case "SCHEDULED":
    case "AVAILABLE":
      return "info";
    case "CALLED":
    case "DUE":
    case "ON_HOLD":
    case "PENDING":
    case "HELD":
    case "OPEN":
      return "warn";
    case "NOT_INTERESTED":
    case "UNREACHABLE":
    case "LOST":
    case "OVERDUE":
    case "BLOCKED":
    case "NO_SHOW":
    case "CANCELLED":
      return "bad";
    default:
      return "neutral";
  }
}

/* ------------------------------------------------------------------ tables */

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="scroll-x">
      <table className="w-full min-w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  align = "left",
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={cx(
        "dim border-b hairline px-3 py-2 text-xs font-semibold whitespace-nowrap",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left"
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className,
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <td
      className={cx(
        "border-b hairline px-3 py-2.5 align-middle",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </td>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="dim py-8 text-center text-sm">{children}</p>;
}

/* ----------------------------------------------------------------- buttons */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "on-dark";

/**
 * `on-dark` exists because the brand green fails AA with white text. On a black
 * surface the CTA flips to green-400 with black text, which measures 8.69:1.
 */
const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-green-700 text-white hover:bg-green-700/90",
  "on-dark": "bg-green-400 text-ink-950 hover:bg-green-400/90",
  secondary: "surface border hairline text-ink-950 hover:bg-ink-50",
  ghost: "text-ink-900 hover:bg-ink-100",
  danger: "bg-[color:var(--color-danger)] text-white hover:opacity-90",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    // Minimum 44px touch target at md and lg (ui-ux-pro-max priority 2).
    sm: "px-3 py-1.5 text-xs gap-1",
    md: "px-4 py-2.5 text-sm gap-1.5 min-h-11",
    lg: "px-6 py-3 text-base gap-2 min-h-12",
  } as const;
  return (
    <button
      {...rest}
      className={cx(
        "press inline-flex items-center justify-center rounded-field font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40",
        BUTTON_VARIANTS[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ inputs */

export const fieldClass =
  "surface w-full rounded-field border hairline px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 outline-none transition-colors focus:border-green-700 disabled:bg-ink-50 disabled:text-ink-500 aria-[invalid=true]:border-[color:var(--color-danger)]";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold text-ink-950">
        {label}
      </label>
      {children}
      {/* Helper sits under the field; the error replaces it, next to the input. */}
      {error ? (
        <p className="mt-1 text-xs font-medium text-[color:var(--color-danger)]">{error}</p>
      ) : hint ? (
        <p className="dim mt-1 text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- feedback */

export function Progress({ value, tone = "brand" }: { value: number; tone?: "brand" | "bad" }) {
  const colors = { brand: "bg-green-500", bad: "bg-[color:var(--color-danger)]" };
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-ink-100"
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cx("h-full rounded-full transition-[width] duration-300", colors[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/** Skeletons reserve the real element's box, so nothing shifts on load. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded bg-ink-100", className)} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div className="surface rounded-card border hairline p-4">
      <Skeleton className="mb-3 h-40 w-full rounded-field" />
      <Skeleton className="mb-2 h-4 w-2/3" />
      <Skeleton className="mb-2 h-4 w-1/3" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 w-24 rounded-field" />
        <Skeleton className="h-9 w-24 rounded-field" />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cx("animate-spin", className)}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path
        d="M14.5 8A6.5 6.5 0 0 0 8 1.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ charts */

export function FunnelChart({
  steps,
}: {
  steps: Array<{ label: string; count: number; ofTotal: number; ofPrevious: number }>;
}) {
  return (
    <ol className="space-y-2.5">
      {steps.map((s, i) => (
        <li key={s.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium">{s.label}</span>
            <span className="tabular-nums">
              <strong>{s.count.toLocaleString("en-IN")}</strong>
              {i > 0 && <span className="dim ml-2 text-xs">{s.ofPrevious.toFixed(0)}% of previous</span>}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${Math.max(s.ofTotal, 1.5)}%`, opacity: 1 - i * 0.09 }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function BarChart({
  data,
  max,
}: {
  data: Array<{ label: string; a: number; b: number }>;
  max?: number;
}) {
  const ceiling = max ?? Math.max(1, ...data.map((d) => d.a));
  return (
    <div className="flex h-36 items-end gap-1.5">
      {data.map((d) => (
        <div
          key={d.label}
          className="flex h-full flex-1 flex-col justify-end"
          title={`${d.label}: ${d.a} calls, ${d.b} connected`}
        >
          <div className="relative w-full" style={{ height: `${(d.a / ceiling) * 100}%` }}>
            <div className="absolute inset-0 rounded-t bg-ink-100" />
            <div
              className="absolute bottom-0 w-full rounded-t bg-green-500"
              style={{ height: `${d.a ? (d.b / d.a) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Price movement. Red is functional here, not decorative. */
export function PriceTrend({ percent, years = 3 }: { percent: number; years?: number }) {
  const up = percent >= 0;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 text-sm font-semibold tabular-nums",
        up ? "text-green-700" : "text-[color:var(--color-danger)]"
      )}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" fill="currentColor">
        {up ? <path d="M5 0l5 9H0z" /> : <path d="M5 10L0 1h10z" />}
      </svg>
      {Math.abs(percent).toFixed(2)}%
      <span className="dim font-normal">({years}yrs)</span>
      {/* Never colour alone: the arrow and sign carry the meaning too. */}
      <span className="sr-only">{up ? "increase" : "decrease"}</span>
    </span>
  );
}
