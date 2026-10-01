import { Logo, LogoMark } from "@/components/brand/Logo";
import {
  Badge,
  BarChart,
  Button,
  Card,
  Empty,
  Field,
  FunnelChart,
  PriceTrend,
  Progress,
  Skeleton,
  SkeletonCard,
  Spinner,
  Stat,
  StatGrid,
  Table,
  Td,
  Th,
  fieldClass,
  type BadgeTone,
  type ButtonVariant,
} from "@/components/ui";
import { ReraBadge, TrustStats, VerifiedBadge, ZeroBrokerageBadge } from "@/components/trust/Trust";
import { PLACEHOLDERS } from "@/data/placeholders";
import { TOKENS, contrast, grade, ratioLabel } from "@/lib/contrast";

export const metadata = { title: "Styleguide" };

/* ----------------------------------------------------------------- layout */

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t hairline py-12 first:border-t-0">
      <h2 className="text-2xl font-bold">{title}</h2>
      {intro && <p className="dim mt-2 max-w-2xl text-sm">{intro}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Spec({ children }: { children: React.ReactNode }) {
  return <p className="dim mb-3 text-xs">{children}</p>;
}

/** A labelled demo cell, so every state is named rather than guessed at. */
function State({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="dim mb-2 text-xs font-medium">{name}</p>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ colour */

const SWATCHES: Array<{ name: string; token: string; hex: string; use: string }> = [
  { name: "black", token: "--black", hex: TOKENS.black, use: "Header, footer, hero overlay, headings" },
  { name: "ink", token: "--ink", hex: TOKENS.ink, use: "Body text" },
  { name: "muted", token: "--muted", hex: TOKENS.muted, use: "Secondary text" },
  { name: "border", token: "--border", hex: TOKENS.border, use: "Hairlines, dividers" },
  { name: "surface-alt", token: "--surface-alt", hex: TOKENS.surfaceAlt, use: "Alternating sections" },
  { name: "white", token: "--bg", hex: TOKENS.white, use: "Page, cards" },
  { name: "green", token: "--green", hex: TOKENS.green, use: "Logo, pins, underlines, large text" },
  { name: "green-700", token: "--green-700", hex: TOKENS.green700, use: "Buttons, links on white" },
  { name: "green-400", token: "--green-400", hex: TOKENS.green400, use: "CTAs on black" },
  { name: "green-50", token: "--green-50", hex: TOKENS.green50, use: "Tints, active chips" },
  { name: "danger", token: "--danger", hex: TOKENS.danger, use: "Negative trends, errors only" },
];

const PAIRS: Array<{ label: string; fg: string; bg: string; large?: boolean; note?: string }> = [
  { label: "Body text", fg: TOKENS.ink, bg: TOKENS.white },
  { label: "Secondary text", fg: TOKENS.muted, bg: TOKENS.white },
  { label: "Heading", fg: TOKENS.black, bg: TOKENS.white },
  { label: "Inverted", fg: TOKENS.white, bg: TOKENS.black },
  { label: "Primary button", fg: TOKENS.white, bg: TOKENS.green700 },
  { label: "CTA on black", fg: TOKENS.black, bg: TOKENS.green400 },
  { label: "Link on white", fg: TOKENS.green700, bg: TOKENS.white },
  { label: "Chip label", fg: TOKENS.green700, bg: TOKENS.green50 },
  { label: "Error text", fg: TOKENS.danger, bg: TOKENS.white },
  {
    label: "Brand green text",
    fg: TOKENS.green,
    bg: TOKENS.white,
    large: true,
    note: "Large text only — 3.30:1 fails AA at body size",
  },
  { label: "Brand green on black", fg: TOKENS.green, bg: TOKENS.black, large: true },
];

const FORBIDDEN = [
  {
    label: "White text on brand green",
    fg: TOKENS.white,
    bg: TOKENS.green,
    why: "Use green-700 behind white text instead.",
  },
];

/* ------------------------------------------------------------------- page */

const BADGE_TONES: BadgeTone[] = ["neutral", "brand", "good", "warn", "bad", "info", "muted"];
const BUTTON_VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];

const NAV = [
  ["logo", "Logo"],
  ["colour", "Colour"],
  ["contrast", "Contrast"],
  ["type", "Typography"],
  ["buttons", "Buttons"],
  ["forms", "Forms"],
  ["badges", "Badges"],
  ["cards", "Cards & stats"],
  ["data", "Data display"],
  ["feedback", "Loading & empty"],
  ["trust", "Trust components"],
  ["images", "Placeholders"],
  ["motion", "Motion & focus"],
];

export default function StyleguidePage() {
  return (
    <div className="min-h-screen">
      {/* Black header with the rounded bottom edge the brand calls for. */}
      <header className="sticky top-0 z-50 rounded-b-2xl bg-ink-950 text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo variant="on-dark" height={28} priority />
          <p className="hidden text-sm text-white/70 sm:block">Design system</p>
          <Button variant="on-dark">Post Property</Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-24">
        <div className="py-10">
          <h1 className="text-3xl font-extrabold sm:text-4xl">The Urban Firm design system</h1>
          <p className="dim mt-3 max-w-2xl">
            Green, black and white. Green is the action colour and appears sparingly; black carries
            the structure; white is the page. Every colour pair below shows its measured WCAG ratio —
            the numbers are computed at render time, not written by hand, so a token change that
            breaks contrast shows up here immediately.
          </p>
          <nav className="mt-6 flex flex-wrap gap-2">
            {NAV.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="inline-flex min-h-11 items-center rounded-full border hairline px-4 text-xs font-medium transition-colors hover:bg-ink-50"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* ------------------------------------------------------------ logo */}
        <Section
          id="logo"
          title="Logo"
          intro="Supplied artwork, rendered untouched. Clear space equals the height of the green block and is built into the component, so it cannot be crowded by accident."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface rounded-card border hairline p-6">
              <Spec>Primary — on white</Spec>
              <Logo height={40} />
            </div>
            <div className="rounded-card bg-ink-950 p-6">
              <p className="mb-3 text-xs text-white/60">On dark — black header, hero, footer</p>
              <Logo variant="on-dark" height={40} />
            </div>
            <div className="surface rounded-card border hairline p-6">
              <Spec>Mono — print, watermark</Spec>
              <Logo variant="mono" height={40} />
            </div>
            <div className="surface rounded-card border hairline p-6">
              <Spec>Marks — app icon, avatar, favicon</Spec>
              <div className="flex items-center gap-4">
                <LogoMark size={56} />
                <LogoMark green size={56} />
                <LogoMark size={32} />
                <LogoMark size={20} />
              </div>
            </div>
          </div>
          <p className="dim mt-4 text-xs">
            Never recolour, stretch, rotate or add effects. Below 20px use the mark, not the lockup.
          </p>
        </Section>

        {/* ---------------------------------------------------------- colour */}
        <Section id="colour" title="Colour" intro="Eleven values. No other accent exists.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SWATCHES.map((s) => (
              <div key={s.name} className="surface overflow-hidden rounded-card border hairline">
                <div
                  className="h-16 w-full border-b hairline"
                  style={{ background: s.hex }}
                  aria-hidden="true"
                />
                <div className="p-3">
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="dim font-mono text-xs">{s.hex}</p>
                  <p className="dim mt-1 text-xs">{s.use}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* -------------------------------------------------------- contrast */}
        <Section
          id="contrast"
          title="Contrast"
          intro="Measured at render time with the WCAG 2.1 relative-luminance formula. Large means 24px or 18.66px bold, which only needs 3:1."
        >
          <div className="surface overflow-hidden rounded-card border hairline">
            <Table>
              <thead>
                <tr>
                  <Th>Pair</Th>
                  <Th>Sample</Th>
                  <Th align="right">Ratio</Th>
                  <Th>Grade</Th>
                  <Th>Note</Th>
                </tr>
              </thead>
              <tbody>
                {PAIRS.map((p) => {
                  const r = contrast(p.fg, p.bg);
                  const g = grade(r, p.large);
                  return (
                    <tr key={p.label}>
                      <Td className="font-medium whitespace-nowrap">{p.label}</Td>
                      <Td>
                        <span
                          className="inline-block rounded px-2.5 py-1 text-sm font-semibold"
                          style={{ background: p.bg, color: p.fg }}
                        >
                          Aa sample
                        </span>
                      </Td>
                      <Td align="right" className="font-mono text-xs tabular-nums">
                        {ratioLabel(r)}
                      </Td>
                      <Td>
                        <Badge tone={g === "Fail" ? "bad" : "good"}>{g}</Badge>
                      </Td>
                      <Td className="dim text-xs">{p.note ?? ""}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          <h3 className="mt-8 text-sm font-semibold">Do not use</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {FORBIDDEN.map((f) => {
              const r = contrast(f.fg, f.bg);
              return (
                <div key={f.label} className="rounded-card border-2 border-[color:var(--color-danger)] p-4">
                  <span
                    className="inline-block rounded px-2.5 py-1 text-sm font-semibold"
                    style={{ background: f.bg, color: f.fg }}
                  >
                    Aa sample
                  </span>
                  <p className="mt-2 text-sm font-semibold">{f.label}</p>
                  <p className="dim text-xs">
                    {ratioLabel(r)} — {f.why}
                  </p>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ------------------------------------------------------------ type */}
        <Section
          id="type"
          title="Typography"
          intro="Plus Jakarta Sans throughout, self-hosted at build time. One family, five weights. Prices use Indian number formatting."
        >
          <div className="surface rounded-card border hairline p-6">
            <div className="space-y-5">
              {[
                ["40 / 800", "text-[40px] font-extrabold leading-[1.1]", "Properties to buy in Hyderabad"],
                ["32 / 700", "text-[32px] font-bold leading-[1.15]", "Hotspots nearby"],
                ["24 / 700", "text-2xl font-bold", "Independent villas for sale"],
                ["18 / 600", "text-lg font-semibold", "Risinia Capital Greens"],
                ["16 / 400", "text-base", "Nestled in Gagillapur, this project spreads across six acres."],
                ["14 / 400", "text-sm", "Kukatpally Housing Board Colony, North Hyderabad"],
                ["12 / 500", "text-xs font-medium dim", "Last updated 30 Sep 2026"],
              ].map(([spec, cls, sample]) => (
                <div key={spec} className="flex flex-wrap items-baseline gap-4 border-b hairline pb-4 last:border-0 last:pb-0">
                  <span className="dim w-20 shrink-0 font-mono text-xs">{spec}</span>
                  <span className={cls as string}>{sample}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t hairline pt-5">
              <Spec>Prices — lakh/crore convention, bold, tabular</Spec>
              <div className="flex flex-wrap gap-6">
                <span className="text-xl font-bold tabular-nums">₹1.39 Cr</span>
                <span className="text-xl font-bold tabular-nums">₹22,000/month</span>
                <span className="text-xl font-bold tabular-nums">₹7,000/bed</span>
                <span className="text-xl font-bold tabular-nums">₹9.9K/sq.ft</span>
              </div>
            </div>
          </div>
        </Section>

        {/* --------------------------------------------------------- buttons */}
        <Section
          id="buttons"
          title="Buttons"
          intro="Every state, including the on-dark variant that exists because white text on brand green fails AA."
        >
          <div className="surface rounded-card border hairline p-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {BUTTON_VARIANTS.map((v) => (
                <div key={v}>
                  <p className="dim mb-3 text-xs font-medium">{v}</p>
                  <div className="flex flex-col items-start gap-2">
                    <Button variant={v}>Default</Button>
                    <Button variant={v} className="ring-2 ring-green-700 ring-offset-2">
                      Focus
                    </Button>
                    <Button variant={v} disabled>
                      Disabled
                    </Button>
                    <Button variant={v} disabled>
                      <Spinner /> Loading
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-card bg-ink-950 p-6">
              <p className="mb-3 text-xs font-medium text-white/60">on-dark — black text on green-400, 8.69:1</p>
              <div className="flex flex-wrap items-start gap-2">
                <Button variant="on-dark">Default</Button>
                <Button variant="on-dark" className="ring-2 ring-white ring-offset-2 ring-offset-ink-950">
                  Focus
                </Button>
                <Button variant="on-dark" disabled>
                  Disabled
                </Button>
                <Button variant="on-dark" disabled>
                  <Spinner /> Loading
                </Button>
              </div>
            </div>

            <div className="mt-8 border-t hairline pt-6">
              <Spec>Sizes — md and lg meet the 44px minimum touch target</Spec>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
          </div>
        </Section>

        {/* ----------------------------------------------------------- forms */}
        <Section
          id="forms"
          title="Forms"
          intro="Labels are always visible — never placeholder-only. Errors sit next to the field they belong to."
        >
          <div className="surface rounded-card border hairline p-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <State name="default">
                <Field label="Locality" htmlFor="sg-1">
                  <input id="sg-1" className={fieldClass} placeholder="Kukatpally" />
                </Field>
              </State>
              <State name="filled">
                <Field label="Locality" htmlFor="sg-2">
                  <input id="sg-2" className={fieldClass} defaultValue="Gachibowli" />
                </Field>
              </State>
              <State name="with hint">
                <Field label="Budget" htmlFor="sg-3" hint="We show matches within 10% of this.">
                  <input id="sg-3" className={fieldClass} defaultValue="₹80,00,000" />
                </Field>
              </State>
              <State name="error">
                <Field label="Phone" htmlFor="sg-4" error="Enter a 10-digit mobile number.">
                  <input id="sg-4" className={fieldClass} defaultValue="98765" aria-invalid="true" />
                </Field>
              </State>
              <State name="disabled">
                <Field label="City" htmlFor="sg-5" hint="Only Hyderabad for now.">
                  <input id="sg-5" className={fieldClass} defaultValue="Hyderabad" disabled />
                </Field>
              </State>
              <State name="select">
                <Field label="Property type" htmlFor="sg-6">
                  <select id="sg-6" className={fieldClass} defaultValue="flat">
                    <option value="flat">Flat / apartment</option>
                    <option value="villa">Villa</option>
                    <option value="plot">Plot</option>
                  </select>
                </Field>
              </State>
            </div>

            <div className="mt-6 border-t hairline pt-6">
              <Spec>Filter chips — default and selected</Spec>
              <div className="flex flex-wrap gap-2">
                {["Any", "1 BHK", "2 BHK", "3 BHK"].map((c, i) => (
                  <button
                    key={c}
                    className={
                      i === 2
                        ? "rounded-field border border-green-700 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700"
                        : "rounded-field border hairline px-3 py-2 text-sm transition-colors hover:bg-ink-50"
                    }
                  >
                    {c}
                  </button>
                ))}
                <button className="inline-flex items-center gap-1.5 rounded-field border border-green-700 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                  Kukatpally
                  <span aria-hidden="true">×</span>
                  <span className="sr-only">Remove Kukatpally filter</span>
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* ---------------------------------------------------------- badges */}
        <Section
          id="badges"
          title="Badges"
          intro="Two colour families only. 'warn' is black rather than amber, because a fourth colour would break the brand rule."
        >
          <div className="surface rounded-card border hairline p-6">
            <div className="flex flex-wrap gap-2">
              {BADGE_TONES.map((t) => (
                <Badge key={t} tone={t}>
                  {t}
                </Badge>
              ))}
            </div>
            <div className="mt-6 border-t hairline pt-6">
              <Spec>In use</Spec>
              <div className="flex flex-wrap gap-2">
                <Badge tone="good">Ready to move</Badge>
                <Badge tone="brand">New launch</Badge>
                <Badge tone="warn">Sponsored</Badge>
                <Badge tone="bad">Sold out</Badge>
                <Badge tone="neutral">Resale</Badge>
              </div>
            </div>
          </div>
        </Section>

        {/* ----------------------------------------------------------- cards */}
        <Section id="cards" title="Cards & stats">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="Card with header" subtitle="Subtitle explains the contents">
              <p className="text-sm">
                Cards use a 12px radius and a hairline border rather than a shadow, so stacked
                content stays flat and legible.
              </p>
            </Card>
            <Card>
              <p className="text-sm">A card with no header at all.</p>
            </Card>
          </div>
          <div className="mt-5">
            <StatGrid cols={4}>
              <Stat label="Total leads" value="420" hint="1,414 calls logged" />
              <Stat label="Interested" value="211" tone="brand" hint="63.7% of called" />
              <Stat label="Bought" value="26" tone="good" hint="28% of visitors" />
              <Stat label="Overdue" value="13" tone="bad" hint="Past due date" />
            </StatGrid>
          </div>
        </Section>

        {/* ------------------------------------------------------------ data */}
        <Section id="data" title="Data display">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="Price trend" subtitle="Colour is never the only signal — the arrow and sign carry it too.">
              <div className="flex flex-wrap items-center gap-6">
                <PriceTrend percent={5.08} />
                <PriceTrend percent={-4.83} />
              </div>
            </Card>
            <Card title="Progress">
              <div className="space-y-4">
                <Progress value={72} />
                <Progress value={28} tone="bad" />
              </div>
            </Card>
            <Card title="Funnel">
              <FunnelChart
                steps={[
                  { label: "Total leads", count: 420, ofTotal: 100, ofPrevious: 100 },
                  { label: "Called", count: 331, ofTotal: 78.8, ofPrevious: 78.8 },
                  { label: "Interested", count: 211, ofTotal: 50.2, ofPrevious: 63.7 },
                  { label: "Visited", count: 93, ofTotal: 22.1, ofPrevious: 44.1 },
                  { label: "Bought", count: 26, ofTotal: 6.2, ofPrevious: 28 },
                ]}
              />
            </Card>
            <Card title="Bars">
              <BarChart
                data={Array.from({ length: 14 }, (_, i) => ({
                  label: `d${i}`,
                  a: 40 + ((i * 17) % 60),
                  b: 20 + ((i * 11) % 40),
                }))}
              />
            </Card>
          </div>

          <div className="mt-5">
            <Card title="Table">
              <Table>
                <thead>
                  <tr>
                    <Th>Configuration</Th>
                    <Th align="right">Area</Th>
                    <Th align="right">Price</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["2 BHK", "1,180 sq.ft", "₹95.0 L", "good"],
                    ["3 BHK", "1,640 sq.ft", "₹1.32 Cr", "good"],
                    ["4 BHK", "2,460 sq.ft", "₹2.10 Cr", "bad"],
                  ].map(([cfg, area, price, tone]) => (
                    <tr key={cfg as string}>
                      <Td className="font-medium">{cfg}</Td>
                      <Td align="right" className="tabular-nums">{area}</Td>
                      <Td align="right" className="font-semibold tabular-nums">{price}</Td>
                      <Td>
                        <Badge tone={tone as BadgeTone}>{tone === "good" ? "Available" : "Sold out"}</Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </div>
        </Section>

        {/* -------------------------------------------------------- feedback */}
        <Section
          id="feedback"
          title="Loading & empty"
          intro="Skeletons reserve the real element's box so nothing shifts when content arrives. Empty states invite an action rather than apologise."
        >
          <div className="grid gap-5 lg:grid-cols-3">
            <SkeletonCard />
            <Card title="Inline loading">
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Spinner /> Searching Kukatpally…
              </div>
            </Card>
            <Card title="Empty state">
              <Empty>Nothing matches those filters.</Empty>
              <div className="flex justify-center">
                <Button variant="secondary" size="sm">
                  Clear filters
                </Button>
              </div>
            </Card>
          </div>
        </Section>

        {/* ----------------------------------------------------------- trust */}
        <Section
          id="trust"
          title="Trust components"
          intro="These read from /config/trust.ts, which ships entirely empty. Each one returns null until a real value is filled in — so nothing below renders yet, and that is correct."
        >
          <div className="surface rounded-card border hairline p-6">
            <div className="rounded-card border-2 border-dashed hairline p-6">
              <div className="flex flex-wrap items-center gap-3">
                <TrustStats tone="light" />
                <VerifiedBadge />
                <ZeroBrokerageBadge />
                <ReraBadge registrationNumber="P02400004521" />
              </div>
              <p className="dim text-center text-sm">
                Empty by design — fill in <code className="rounded bg-ink-100 px-1">src/config/trust.ts</code> and
                these appear.
              </p>
            </div>
            <p className="dim mt-4 text-xs">
              The RERA badge is stricter than the others: even when enabled globally it refuses to
              render without a project-level registration number, because the badge is only lawful
              alongside one.
            </p>
          </div>
        </Section>

        {/* ------------------------------------------------------ placeholders */}
        <Section
          id="images"
          title="Placeholder photography"
          intro="Every stock photo is registered in one file with its source and photographer. In development each one carries a small 'placeholder' tag; the tag is compiled out of production builds."
        >
          <div className="surface overflow-hidden rounded-card border hairline">
            <Table>
              <thead>
                <tr>
                  <Th>Id</Th>
                  <Th>Used for</Th>
                  <Th>Source</Th>
                  <Th>Photographer</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {PLACEHOLDERS.map((p) => (
                  <tr key={p.id}>
                    <Td className="font-mono text-xs">{p.id}</Td>
                    <Td className="text-sm">{p.usage}</Td>
                    <Td className="text-sm capitalize">{p.source}</Td>
                    <Td className="dim text-sm">{p.photographer}</Td>
                    <Td>
                      <Badge tone={p.replaced ? "good" : "warn"}>
                        {p.replaced ? "Replaced" : "Placeholder"}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <p className="dim mt-3 text-xs">
            Run <code className="rounded bg-ink-100 px-1">npm run placeholders</code> to list what is
            still outstanding before launch.
          </p>
        </Section>

        {/* ---------------------------------------------------------- motion */}
        <Section
          id="motion"
          title="Motion & focus"
          intro="Motion answers an action; it does not decorate. Everything here is disabled under prefers-reduced-motion."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="Hover — card lift">
              <div className="surface cursor-pointer rounded-card border hairline p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <p className="text-sm font-semibold">Hover this card</p>
                <p className="dim text-xs">Lifts 2px over 200ms, ease-out.</p>
              </div>
            </Card>
            <Card title="Focus ring">
              <p className="dim mb-3 text-xs">
                Tab through these. The ring is 2px green-700 with a 2px offset, on every interactive
                element.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm">Button</Button>
                <a href="#motion" className="rounded-field px-3 py-2 text-sm font-semibold text-green-700 underline">
                  Link
                </a>
                <input className={`${fieldClass} w-40`} aria-label="Focus demo" placeholder="Input" />
              </div>
            </Card>
          </div>
          <div className="surface mt-5 rounded-card border hairline p-6">
            <Spec>Timing</Spec>
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              <li>Hover / colour change — 150ms</li>
              <li>Card lift and image zoom — 200ms ease-out</li>
              <li>Hero tab cross-fade — 400ms</li>
              <li>Mega menu open — 150ms delay, then 180ms fade</li>
            </ul>
          </div>
        </Section>
      </div>

      <footer className="bg-ink-950 py-10 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
          <Logo variant="on-dark" height={28} />
          <p className="text-xs text-white/60">
            Phase 2 deliverable — design tokens and component states.
          </p>
        </div>
      </footer>
    </div>
  );
}
