/**
 * WCAG 2.1 contrast, computed rather than asserted.
 *
 * The styleguide prints the ratio next to every colour pair, so a token change
 * that quietly breaks AA shows up on the page instead of in an audit months
 * later.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** Relative luminance per WCAG 2.1, sRGB channels linearised. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio between two hex colours, 1 → 21. */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export type WcagLevel = "AAA" | "AA" | "AA Large" | "Fail";

/**
 * Grades a pair. `large` means >= 24px, or >= 18.66px bold — those only need
 * 3:1. Non-text UI (borders, icons, focus rings) also needs 3:1.
 */
export function grade(ratio: number, large = false): WcagLevel {
  if (large) {
    if (ratio >= 4.5) return "AAA";
    if (ratio >= 3) return "AA Large";
    return "Fail";
  }
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}

export function ratioLabel(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

/** Every token in one place, so the styleguide and docs cannot drift apart. */
export const TOKENS = {
  black: "#0A0A0A",
  ink: "#171717",
  muted: "#525252",
  border: "#E5E5E5",
  surfaceAlt: "#FAFAFA",
  white: "#FFFFFF",
  green: "#16A34A",
  green700: "#15803D",
  green400: "#22C55E",
  green50: "#F0FDF4",
  danger: "#DC2626",
} as const;

export type TokenName = keyof typeof TOKENS;
