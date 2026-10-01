/**
 * Verifies every colour pair the design system actually uses, and fails if one
 * drops below its required WCAG level.
 *
 *   npm run contrast
 *
 * Run it in CI so a token tweak cannot quietly break accessibility.
 */
import { contrast, grade, ratioLabel, TOKENS as T } from "../src/lib/contrast";

interface Pair {
  name: string;
  fg: string;
  bg: string;
  /** Large text (>=24px, or >=18.66px bold) and non-text UI need only 3:1. */
  large?: boolean;
  /** Minimum ratio this pair must meet to pass the build. */
  min: number;
  /** Non-text decoration: graded as a separation cue, not as text. */
  decorative?: boolean;
}

const PAIRS: Pair[] = [
  { name: "Body text — ink on white", fg: T.ink, bg: T.white, min: 4.5 },
  { name: "Secondary text — muted on white", fg: T.muted, bg: T.white, min: 4.5 },
  { name: "Heading — black on white", fg: T.black, bg: T.white, min: 4.5 },
  { name: "Inverted — white on black", fg: T.white, bg: T.black, min: 4.5 },
  { name: "Primary button — white on green-700", fg: T.white, bg: T.green700, min: 4.5 },
  { name: "CTA on black — black on green-400", fg: T.black, bg: T.green400, min: 4.5 },
  { name: "Link — green-700 on white", fg: T.green700, bg: T.white, min: 4.5 },
  { name: "Body on tint — ink on green-50", fg: T.ink, bg: T.green50, min: 4.5 },
  { name: "Chip label — green-700 on green-50", fg: T.green700, bg: T.green50, min: 4.5 },
  { name: "Error text — danger on white", fg: T.danger, bg: T.white, min: 4.5 },
  { name: "Body on alt surface — ink on #FAFAFA", fg: T.ink, bg: T.surfaceAlt, min: 4.5 },
  // Large/non-text: 3:1 is the bar.
  { name: "Brand green on white (LARGE text only)", fg: T.green, bg: T.white, large: true, min: 3 },
  { name: "Brand green on black (pins, icons)", fg: T.green, bg: T.black, large: true, min: 3 },
  { name: "green-400 on black (large)", fg: T.green400, bg: T.black, large: true, min: 3 },
  { name: "Focus ring — green-700 on white", fg: T.green700, bg: T.white, large: true, min: 3 },
  { name: "Border — #E5E5E5 on white", fg: T.border, bg: T.white, decorative: true, min: 1.2 },
];

/** Pairs the brand rules forbid; the build fails if one starts passing silently. */
const MUST_NOT_USE: Pair[] = [
  { name: "white on brand green (small text)", fg: T.white, bg: T.green, min: 4.5 },
];

let failed = 0;
console.log("\nContrast audit — The Urban Firm\n");
console.log("  " + "Pair".padEnd(44) + "Ratio".padStart(9) + "   Grade     Required");
console.log("  " + "-".repeat(76));

for (const p of PAIRS) {
  const r = contrast(p.fg, p.bg);
  const ok = r >= p.min;
  if (!ok) failed++;
  console.log(
    "  " +
      (ok ? "✓ " : "✗ ") +
      p.name.padEnd(42) +
      ratioLabel(r).padStart(9) +
      "   " +
      (p.decorative ? "decorative" : grade(r, p.large)).padEnd(10) +
      `>= ${p.min}`
  );
}

console.log("\n  Deliberately not used (documented in the styleguide):");
for (const p of MUST_NOT_USE) {
  const r = contrast(p.fg, p.bg);
  console.log(
    `    ${p.name.padEnd(40)} ${ratioLabel(r).padStart(9)}   ${grade(r, p.large)} — correctly avoided`
  );
}

if (failed) {
  console.error(`\n${failed} pair(s) below the required ratio.\n`);
  process.exit(1);
}
console.log("\nAll pairs meet their required level.\n");
