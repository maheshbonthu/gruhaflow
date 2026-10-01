import type { ReactNode } from "react";
import { TRUST, activeStats, badgeActive, hasStats } from "@/config/trust";

/**
 * Trust components render nothing until real figures exist in /config/trust.ts.
 * That is the point: an unfilled claim should be invisible, never a placeholder
 * number that could ship by accident.
 */

export function TrustStats({ tone = "dark" }: { tone?: "dark" | "light" }) {
  if (!hasStats()) return null;
  const stats = activeStats();
  return (
    <p
      className={[
        "text-sm sm:text-base",
        tone === "dark" ? "text-white/80" : "text-ink-500",
      ].join(" ")}
    >
      {stats.map((s, i) => (
        <span key={s.label}>
          {i > 0 && <span className="mx-2 opacity-50">·</span>}
          <strong className={tone === "dark" ? "text-white" : "text-ink-950"}>{s.value}</strong>{" "}
          {s.label}
        </span>
      ))}
    </p>
  );
}

function BadgeShell({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700"
    >
      {children}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8.5l3.5 3.5L13 5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function VerifiedBadge() {
  if (!badgeActive("verified")) return null;
  const b = TRUST.badges.verified;
  return (
    <BadgeShell title={b.description || undefined}>
      <CheckIcon />
      {b.label}
    </BadgeShell>
  );
}

export function ZeroBrokerageBadge() {
  if (!badgeActive("zeroBrokerage")) return null;
  const b = TRUST.badges.zeroBrokerage;
  return <BadgeShell title={b.description || undefined}>{b.label}</BadgeShell>;
}

/**
 * RERA is the strictest of the three: the badge is only legitimate next to the
 * actual registration number for that project, so it refuses to render without
 * one even when the badge is switched on globally.
 */
export function ReraBadge({ registrationNumber }: { registrationNumber?: string }) {
  if (!badgeActive("rera")) return null;
  if (!registrationNumber?.trim()) return null;
  const b = TRUST.badges.rera;
  return (
    <BadgeShell title={`${b.authority} registration ${registrationNumber}`}>
      {b.label} {registrationNumber}
    </BadgeShell>
  );
}

export function AwardsRow() {
  if (!TRUST.awards.length) return null;
  return (
    <ul className="flex flex-wrap gap-3">
      {TRUST.awards.map((a) => (
        <li
          key={`${a.title}-${a.year}`}
          className="rounded-card border border-white/20 px-3 py-2 text-xs text-white/90"
        >
          <span className="block font-semibold">{a.title}</span>
          <span className="block opacity-70">
            {a.issuer} {a.year}
          </span>
        </li>
      ))}
    </ul>
  );
}
