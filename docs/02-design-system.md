# Phase 2 — Design system

**Status:** awaiting your review.
**Live:** `/styleguide`
**Screenshots:** `docs/screenshots/styleguide-desktop-1280.png`, `docs/screenshots/styleguide-mobile-360.png`

---

## What shipped

| | |
| --- | --- |
| Brand rename | GruhaFlow → The Urban Firm across 35 files, including demo logins (`admin@theurbanfirm.in`), booking codes (`UF-BK-00001`), ticket codes (`UF-SR-1001`) and the database name (`urbanfirm`) |
| Logo | Your SVGs installed untouched at `/public/brand/`, wrapped in a component that enforces clear space |
| Icons | 32px, 180px and 512px PNGs plus a 1200×630 OG image, generated from your SVGs |
| Tokens | Eleven values in `globals.css`, exposed as Tailwind utilities |
| Type | Plus Jakarta Sans, self-hosted at build time with `font-display: swap` |
| Components | Full kit rebuilt against the new tokens, every state represented |
| Trust | `src/config/trust.ts` — ships completely empty, components self-hide |
| Placeholders | `src/data/placeholders.ts` — 9 registered with source and credit |
| Contrast | Computed at render time, printed next to every pair |

---

## Colour decisions you should check

Your palette was accurate — I measured every ratio you quoted and they match exactly (green-700 on white 5.02:1, black on green-400 8.69:1, brand green on white 3.30:1). Three consequences fell out of the three-colour rule:

**1. There is no amber, so "warning" is black.** The badge kit previously used amber for `warn` states (sponsored, pending, due). A fourth colour would break the brand rule, so `warn` is now a black chip with white text and `info` is neutral grey. Five pages that passed `"warn"` to a progress bar for *behind schedule* now pass `"bad"` — red, which is a functional error colour and legitimate here.

**2. Buttons have an `on-dark` variant.** Brand green with white text is 3.30:1 and fails AA, exactly as you flagged. On black surfaces the CTA flips to green-400 with black text (8.69:1). The styleguide shows both and labels the one not to use.

**3. Dark mode is off.** Your spec describes a light system. Leftover `dark:` utilities would have fought the new tokens under OS dark mode, so the `dark:` variant is now bound to an explicit `.dark` class instead of `prefers-color-scheme`. Nothing is lost; the classes are inert until we deliberately build a dark theme.

---

## Two bugs found by reviewing the screenshots

Worth recording because the first one was systemic.

**Unlayered CSS was overriding every Tailwind utility.** I had written `* { border-color: var(--border) }` and the `.surface` / `.dim` helpers outside any `@layer`. Unlayered CSS beats everything Tailwind emits, so *no* `border-*` utility could take effect — including the red border on a validation error and the focus ring colour on buttons. The base resets now sit in `@layer base` and the aliases in `@layer components`, so utilities win at the call site again. This would have been very hard to diagnose later, with every border silently grey.

**A duplicated contrast ratio** in the "do not use" card, which printed `3.30:1 — 3.30:1 — …`.

---

## Accessibility

`npm run contrast` verifies all 16 pairs the system uses and fails the build if one drops below its required level. Current output: every pair passes, most at AAA.

`node scripts/responsive-check.mjs styleguide` checks 360 / 768 / 1280 / 1920 for horizontal overflow and small tap targets. Current output: no horizontal scroll at any width.

Two tap targets were below the 44px minimum and are fixed: the header CTA and the styleguide's own table-of-contents chips. The only remaining sub-44px controls are the deliberate `size="sm"` demos.

> **Constraint to carry into Phase 3:** `size="sm"` is for desktop-dense contexts only — table row actions, inline filter resets. It must never be a primary CTA, because it is 28px tall.

The data table at 360px is wider than the viewport by design: it scrolls inside its own `.scroll-x` container rather than pushing the page sideways. The checker confirms page overflow is 0.

---

## Trust and placeholders, as you specified

`src/config/trust.ts` ships with every value empty. `TrustStats`, `VerifiedBadge`, `ZeroBrokerageBadge` and `AwardsRow` each return `null` until a real value exists, so nothing renders a fake figure. The styleguide shows an empty dashed box where they would appear — that is the correct current state.

`ReraBadge` is deliberately stricter: even with the badge enabled globally it refuses to render without a project-level registration number passed in, because the badge is only lawful next to one.

Nine placeholder images are registered with source URL and photographer. `PlaceholderImage` stamps a small "placeholder" tag in development only — `process.env.NODE_ENV === "development"`, so it is compiled out of production. `npm run placeholders` lists what is outstanding and exits non-zero while any remain.

---

## New commands

```bash
npm run contrast       # verify every colour pair, fails below AA
npm run placeholders   # list images still awaiting real assets
node scripts/shots.mjs <path>             # desktop + mobile screenshots
node scripts/responsive-check.mjs <path>  # overflow + tap targets at 4 widths
```

---

## Open question for Phase 3

The reference uses a **coloured hero per tab** (Buy violet, Plots green, Commercial blue). Our palette has one accent, so the hero cannot change colour per vertical. My plan is to keep every hero black with the photograph behind it, and let the **active tab underline in green** plus the photograph carry the difference. Say if you would rather the Plots tab use a green hero wash, which is the one place a second green surface would still be on-brand.

---

## Not yet built (Phase 3)

The styleguide covers tokens and primitives. The marketplace components — mega menu, hero tabs, autocomplete, filter bar, property card, map markers, gallery modal — are Phase 3, in the order set out in the audit.
