/**
 * Trust claims — the single source for every number and badge that asserts
 * something about the business.
 *
 * EVERY VALUE IS EMPTY BY DESIGN. Nothing here is invented, and the components
 * that read it hide themselves when a value is blank, so an unfilled field
 * renders nothing rather than "XX+" or a placeholder figure.
 *
 * In India several of these are legal claims:
 *   - "RERA registered" requires a real registration number, shown per project.
 *   - "Verified" requires a defined, actually-performed verification process.
 *   - "Zero brokerage" is a pricing promise and must be true for the listings
 *     it is shown against.
 * Fill these in only with figures you can substantiate.
 */

export interface TrustStat {
  /** The number as it should read, e.g. "6K+" or "78,000". Empty = hidden. */
  value: string;
  /** What the number counts, e.g. "listings added daily". */
  label: string;
}

export interface TrustConfig {
  /** Hero stats line. An empty array hides the line entirely. */
  stats: TrustStat[];

  /** Badges. Each is shown only when `enabled` is true AND its copy is set. */
  badges: {
    verified: { enabled: boolean; label: string; description: string };
    zeroBrokerage: { enabled: boolean; label: string; description: string };
    rera: {
      /** A project-level RERA number is still required on each listing. */
      enabled: boolean;
      label: string;
      /** State authority name, e.g. "TS RERA". */
      authority: string;
    };
  };

  /** Awards / certifications shown in the brand banner. Empty = hidden. */
  awards: Array<{ title: string; year: string; issuer: string }>;

  /** Company legal details for the footer. Empty strings are omitted. */
  legal: {
    entityName: string;
    cin: string;
    registeredAddress: string;
    supportEmail: string;
    supportPhone: string;
  };
}

export const TRUST: TrustConfig = {
  stats: [
    // Example of the shape, left empty on purpose:
    // { value: "6K+", label: "listings added daily" },
  ],

  badges: {
    verified: { enabled: false, label: "", description: "" },
    zeroBrokerage: { enabled: false, label: "", description: "" },
    rera: { enabled: false, label: "", authority: "" },
  },

  awards: [],

  legal: {
    entityName: "",
    cin: "",
    registeredAddress: "",
    supportEmail: "",
    supportPhone: "",
  },
};

/* ------------------------------------------------------------------ helpers */

export function hasStats(): boolean {
  return TRUST.stats.some((s) => s.value.trim() && s.label.trim());
}

export function activeStats(): TrustStat[] {
  return TRUST.stats.filter((s) => s.value.trim() && s.label.trim());
}

/** A badge shows only when it is switched on and its copy is filled in. */
export function badgeActive(key: keyof TrustConfig["badges"]): boolean {
  const b = TRUST.badges[key];
  if (!b.enabled || !b.label.trim()) return false;
  if (key === "rera") return Boolean((b as TrustConfig["badges"]["rera"]).authority.trim());
  return true;
}
