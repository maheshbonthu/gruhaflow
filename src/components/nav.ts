import type { Role } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  /** Rendered as the small count chip on the right of the nav row. */
  badge?: number;
}

export const STAFF_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/leads", label: "Leads & calls" },
  { href: "/admin/visits", label: "Site visits" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/handover", label: "Handover tracker" },
  { href: "/admin/services", label: "Service desk" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/billing", label: "Maintenance billing" },
  { href: "/admin/inventory", label: "Projects & units" },
  { href: "/admin/people", label: "Team & residents" },
];

export const AGENT_NAV: NavItem[] = [
  { href: "/agent", label: "My dashboard" },
  { href: "/agent/leads", label: "My call list" },
  { href: "/agent/visits", label: "My site visits" },
];

export const CUSTOMER_NAV: NavItem[] = [
  { href: "/portal", label: "My home" },
  { href: "/portal/journey", label: "Handover progress" },
  { href: "/portal/payments", label: "Payment schedule" },
  { href: "/portal/services", label: "Service requests" },
  { href: "/portal/bills", label: "Maintenance bills" },
];

/** Section roots must match exactly so they do not stay highlighted forever. */
export const NAV_ROOTS = ["/admin", "/agent", "/portal"];

export function navFor(role: Role): NavItem[] {
  if (role === "CUSTOMER") return CUSTOMER_NAV;
  if (role === "AGENT") return AGENT_NAV;
  return STAFF_NAV;
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  MANAGER: "Sales manager",
  AGENT: "Tele-call agent",
  CUSTOMER: "Home owner",
};
