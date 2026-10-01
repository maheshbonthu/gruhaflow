import type { ReactNode } from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------- shell */

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
    <section
      className={cx(
        "surface rounded-xl border hairline shadow-sm",
        className
      )}
    >
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b hairline px-4 py-3 sm:px-5">
          <div>
            {title && <h2 className="text-sm font-semibold tracking-tight">{title}</h2>}
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
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
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
  const tones: Record<string, string> = {
    neutral: "",
    brand: "text-brand-600 dark:text-brand-300",
    good: "text-brand-600 dark:text-brand-300",
    warn: "text-gold-600 dark:text-gold-400",
    bad: "text-rose-600 dark:text-rose-400",
  };
  return (
    <div className="surface rounded-xl border hairline p-4 shadow-sm">
      <p className="dim text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className={cx("mt-1.5 text-2xl font-semibold tabular-nums", tones[tone])}>{value}</p>
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

type BadgeTone = "neutral" | "brand" | "good" | "warn" | "bad" | "info" | "muted";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200",
  muted: "bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400",
  brand: "bg-brand-100 text-brand-700 dark:bg-brand-700/25 dark:text-brand-300",
  good: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  warn: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  bad: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  info: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        BADGE_TONES[tone]
      )}
    >
      {children}
    </span>
  );
}

/** Maps every status enum in the app onto a badge tone. */
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
      return "warn";
    case "NOT_INTERESTED":
    case "UNREACHABLE":
    case "LOST":
    case "OVERDUE":
    case "BLOCKED":
    case "NO_SHOW":
    case "CANCELLED":
      return "bad";
    case "OPEN":
      return "warn";
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

export function Th({ children, align = "left" }: { children?: ReactNode; align?: "left" | "right" | "center" }) {
  return (
    <th
      className={cx(
        "dim border-b hairline px-3 py-2 text-xs font-semibold uppercase tracking-wide whitespace-nowrap",
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

export function Button({
  children,
  variant = "primary",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants: Record<string, string> = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "surface-2 border hairline hover:brightness-95",
    ghost: "hover:surface-2",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };
  return (
    <button
      {...rest}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ charts */

/** Horizontal funnel: each bar is width-proportional to the top of the funnel. */
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
              {i > 0 && (
                <span className="dim ml-2 text-xs">
                  {s.ofPrevious.toFixed(0)}% of previous
                </span>
              )}
            </span>
          </div>
          <div className="surface-2 h-2.5 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{
                width: `${Math.max(s.ofTotal, 1.5)}%`,
                opacity: 1 - i * 0.1,
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Progress({ value, tone = "brand" }: { value: number; tone?: "brand" | "warn" | "bad" }) {
  const colors = { brand: "bg-brand-500", warn: "bg-amber-500", bad: "bg-rose-500" };
  return (
    <div className="surface-2 h-2 w-full overflow-hidden rounded-full" title={`${value}%`}>
      <div className={cx("h-full rounded-full", colors[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/** Two-series vertical bars, drawn with plain divs to stay dependency-free. */
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
        <div key={d.label} className="group flex h-full flex-1 flex-col justify-end" title={`${d.label}: ${d.a} calls, ${d.b} connected`}>
          <div className="relative w-full" style={{ height: `${(d.a / ceiling) * 100}%` }}>
            <div className="surface-2 absolute inset-0 rounded-t" />
            <div
              className="absolute bottom-0 w-full rounded-t bg-brand-500"
              style={{ height: `${d.a ? (d.b / d.a) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
