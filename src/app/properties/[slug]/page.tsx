import Link from "next/link";
import { notFound } from "next/navigation";
import EnquiryForm from "@/components/EnquiryForm";
import PropertyCard from "@/components/PropertyCard";
import PropertyMedia from "@/components/PropertyMedia";
import PublicFooter from "@/components/PublicFooter";
import PublicHeader from "@/components/PublicHeader";
import { Badge, Table, Td, Th } from "@/components/ui";
import { inr, inrExact } from "@/lib/fmt";
import { getListing } from "@/lib/listings";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  UNDER_CONSTRUCTION: "Under construction",
  READY_TO_MOVE: "Ready to move",
  NEW_LAUNCH: "New launch",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) return { title: "Project not found — The Urban Firm" };
  const p = listing.project;
  return {
    title: `${p.name}, ${p.locality} — ${p.configs.join(", ")} from ${inr(p.priceFrom)}`,
    description: p.tagline,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();

  const { project: p, configs, availableUnits, soldUnits, similar } = listing;
  const sold = soldUnits + availableUnits > 0
    ? Math.round((soldUnits / (soldUnits + availableUnits)) * 100)
    : 0;

  return (
    <div>
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <nav className="dim mb-4 flex flex-wrap items-center gap-1.5 text-xs">
          <Link href="/properties" className="hover:underline">All projects</Link>
          <span aria-hidden>/</span>
          <Link href={`/properties?city=${encodeURIComponent(p.city)}`} className="hover:underline">
            {p.city}
          </Link>
          <span aria-hidden>/</span>
          <span>{p.name}</span>
        </nav>

        <div className="overflow-hidden rounded-xl border hairline">
          <div className="relative h-56 sm:h-80">
            <PropertyMedia seed={p.slug} label={`${p.name}, ${p.locality}`} className="h-full w-full" />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <Badge tone={p.status === "READY_TO_MOVE" ? "good" : p.status === "NEW_LAUNCH" ? "info" : "warn"}>
                {STATUS_LABEL[p.status] ?? p.status}
              </Badge>
              <Badge tone="neutral">RERA {p.rera}</Badge>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0 space-y-6">
            <header>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{p.name}</h1>
                  <p className="dim mt-1 text-sm">
                    {p.address} · by {p.builder}
                  </p>
                </div>
                <span className="surface-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold">
                  ★ {p.rating.toFixed(1)}
                </span>
              </div>

              <p className="mt-4 text-xl font-semibold">
                {inr(p.priceFrom)} <span className="dim text-base font-normal">– {inr(p.priceTo)}</span>
              </p>
              <p className="dim text-sm">
                {inrExact(p.pricePerSqft)} per sqft · {p.configs.join(", ")} · {p.sqftFrom}–{p.sqftTo} sqft
              </p>

              <p className="mt-4">{p.tagline}</p>
            </header>

            <section className="surface rounded-xl border hairline p-5 shadow-sm">
              <h2 className="text-sm font-semibold">At a glance</h2>
              <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  ["Possession", p.possession],
                  ["Total units", String(p.totalUnits)],
                  ["Available now", String(availableUnits)],
                  ["Booked", `${sold}%`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="dim text-xs uppercase tracking-wide">{k}</dt>
                    <dd className="mt-0.5 font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="surface-2 mt-4 h-2 overflow-hidden rounded-full">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${sold}%` }} />
              </div>
              <p className="dim mt-1.5 text-xs">
                {soldUnits} of {soldUnits + availableUnits} units in this project are booked.
              </p>
            </section>

            <section className="surface rounded-xl border hairline p-5 shadow-sm">
              <h2 className="text-sm font-semibold">Price & availability by configuration</h2>
              <div className="mt-3">
                <Table>
                  <thead>
                    <tr>
                      <Th>Configuration</Th>
                      <Th align="right">Carpet area</Th>
                      <Th align="right">Starting price</Th>
                      <Th align="right">Available</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {configs.map((c) => (
                      <tr key={c.label}>
                        <Td className="font-medium">{c.label}</Td>
                        <Td align="right" className="tabular-nums whitespace-nowrap">
                          {c.sqftFrom}–{c.sqftTo} sqft
                        </Td>
                        <Td align="right" className="tabular-nums whitespace-nowrap font-semibold">
                          {inr(c.priceFrom)}
                        </Td>
                        <Td align="right">
                          {c.available > 0 ? (
                            <Badge tone="good">{c.available} left</Badge>
                          ) : (
                            <Badge tone="bad">Sold out</Badge>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </section>

            <section className="surface rounded-xl border hairline p-5 shadow-sm">
              <h2 className="text-sm font-semibold">About {p.name}</h2>
              <p className="mt-2.5 text-sm leading-relaxed">{p.about}</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {p.highlights.map((h) => (
                  <li key={h} className="flex gap-2 text-sm">
                    <span className="text-brand-500" aria-hidden>✓</span>
                    {h}
                  </li>
                ))}
              </ul>
            </section>

            <section className="surface rounded-xl border hairline p-5 shadow-sm">
              <h2 className="text-sm font-semibold">Amenities</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.amenities.map((a) => (
                  <span key={a} className="surface-2 rounded-lg px-3 py-1.5 text-sm">
                    {a}
                  </span>
                ))}
              </div>
            </section>

            <section className="surface rounded-xl border hairline p-5 shadow-sm">
              <h2 className="text-sm font-semibold">What happens after you book</h2>
              <p className="dim mt-2 text-sm">
                Booking here does not end at the receipt. You get a portal login that tracks all
                sixteen milestones to your Gruha Pravesham, then stays on for maintenance.
              </p>
              <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  "Token receipt & KYC",
                  "Sale agreement signed",
                  "Home loan sanctioned",
                  "Registration & stamp duty",
                  "Slab-wise construction updates",
                  "Electricity & water sanction",
                  "Interior design & execution",
                  "Snag list closed",
                  "Occupancy certificate",
                  "Key handover",
                  "Gruha Pravesham",
                  "Then: plumbing, electrical, security, housekeeping",
                ].map((step, i) => (
                  <li key={step} className="flex gap-2 text-sm">
                    <span className="dim tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </section>
          </div>

          {/* Sticky enquiry rail — the lead capture. */}
          <aside className="lg:sticky lg:top-20 lg:h-fit">
            <div className="surface rounded-xl border hairline p-5 shadow-sm">
              <h2 className="font-semibold">Interested in {p.name}?</h2>
              <p className="dim mt-1 text-sm">
                Starting {inr(p.priceFrom)} · {availableUnits} units available
              </p>
              <div className="mt-4">
                <EnquiryForm projectId={p.id} projectName={p.name} compact />
              </div>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold tracking-tight">Other projects in {p.city}</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((s) => (
                <PropertyCard key={s.id} p={s} />
              ))}
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
