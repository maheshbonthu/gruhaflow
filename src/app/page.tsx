import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import PropertyMedia from "@/components/PropertyMedia";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import SearchBar from "@/components/SearchBar";
import { getFacets, searchListings } from "@/lib/listings";
import { inr } from "@/lib/fmt";

export const dynamic = "force-dynamic";

const COLLECTIONS = [
  { label: "Ready to move", href: "/properties?status=READY_TO_MOVE", note: "Move in this year" },
  { label: "New launches", href: "/properties?status=NEW_LAUNCH", note: "Best entry pricing" },
  { label: "Villas & row houses", href: "/properties?type=VILLA", note: "Independent living" },
  { label: "Under ₹50 lakh", href: "/properties?max=5000000", note: "First-time buyers" },
  { label: "3 BHK homes", href: "/properties?bhk=3", note: "Most searched" },
  { label: "Luxury above ₹2 Cr", href: "/properties?min=20000000", note: "Premium addresses" },
];

const WHY = [
  {
    title: "Verified listings only",
    body: "Every project here is RERA registered, and the unit availability you see is read live off the builder's own inventory — not a stale brochure.",
  },
  {
    title: "One advisor, start to finish",
    body: "The person who calls you back stays with you through the site visit, the booking, the loan and the registration. No hand-offs to a stranger.",
  },
  {
    title: "We do not stop at the sale",
    body: "After you book, you get a login that tracks all sixteen handover milestones up to your Gruha Pravesham — then handles plumbing, electrical and security requests after you move in.",
  },
];

export default async function Home() {
  const [featured, facets] = await Promise.all([
    searchListings({ sort: "featured" }),
    getFacets(),
  ]);

  const top = featured.slice(0, 6);
  const cheapest = featured.length
    ? Math.min(...featured.map((f) => f.priceFrom))
    : 0;

  return (
    <div>
      <PublicHeader />

      {/* Hero with the search box, the way a portal opens. */}
      <section className="relative overflow-hidden border-b hairline">
        <div className="absolute inset-0 opacity-25">
          <PropertyMedia seed="urbanfirm-hero-skyline" className="h-full w-full" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Find a home you will still be happy with in ten years.
          </h1>
          <p className="dim mt-4 max-w-xl text-base sm:text-lg">
            {featured.length} verified projects across {facets.cities.length} cities, starting at{" "}
            {inr(cheapest)}. Search, shortlist, visit — and then let us run the paperwork, the
            handover and the maintenance.
          </p>

          <div className="mt-7 max-w-4xl">
            <SearchBar cities={facets.cities} big />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="dim">Popular:</span>
            {facets.localities.slice(0, 5).map((l) => (
              <Link
                key={`${l.city}-${l.locality}`}
                href={`/properties?city=${encodeURIComponent(l.city)}&locality=${encodeURIComponent(l.locality)}`}
                className="surface rounded-full border hairline px-3 py-1 transition hover:brightness-95"
              >
                {l.locality}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Browse-by-collection row. */}
        <section>
          <h2 className="text-xl font-semibold tracking-tight">Browse by what matters to you</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COLLECTIONS.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="surface flex items-center justify-between gap-3 rounded-xl border hairline px-4 py-3 shadow-sm transition hover:shadow-md"
              >
                <span>
                  <span className="block text-sm font-medium">{c.label}</span>
                  <span className="dim block text-xs">{c.note}</span>
                </span>
                <span className="dim" aria-hidden>
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Handpicked projects</h2>
              <p className="dim mt-1 text-sm">
                Live availability, RERA numbers and real price bands — no "price on request".
              </p>
            </div>
            <Link
              href="/properties"
              className="text-brand-600 dark:text-brand-300 text-sm font-medium hover:underline"
            >
              See all {featured.length} projects →
            </Link>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {top.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">Explore by city</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {facets.cities.map((city) => {
              const inCity = featured.filter((f) => f.city === city);
              return (
                <Link
                  key={city}
                  href={`/properties?city=${encodeURIComponent(city)}`}
                  className="surface group overflow-hidden rounded-xl border hairline shadow-sm transition hover:shadow-md"
                >
                  <div className="h-28">
                    <PropertyMedia seed={`city-${city}`} className="h-full w-full" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold group-hover:underline">{city}</h3>
                    <p className="dim text-xs">
                      {inCity.length} projects · from{" "}
                      {inCity.length ? inr(Math.min(...inCity.map((c) => c.priceFrom))) : "—"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="surface mt-12 rounded-xl border hairline p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight">
            Most portals stop when you pay. We don't.
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {WHY.map((w) => (
              <div key={w.title}>
                <h3 className="text-sm font-semibold">{w.title}</h3>
                <p className="dim mt-1.5 text-sm">{w.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/properties"
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Start browsing
            </Link>
            <Link
              href="/login"
              className="surface rounded-lg border hairline px-5 py-2.5 text-sm font-semibold transition hover:brightness-95"
            >
              Already a buyer? Track your home
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
