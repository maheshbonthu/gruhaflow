import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import PublicFooter from "@/components/PublicFooter";
import PublicHeader from "@/components/PublicHeader";
import ListingFilters from "./ListingFilters";
import { getFacets, searchListings, type ListingQuery } from "@/lib/listings";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Apartments, villas and new launches — The Urban Firm",
  description: "Search RERA-registered projects with live unit availability and real price bands.",
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const query: ListingQuery = {
    city: sp.city,
    locality: sp.locality,
    type: sp.type,
    status: sp.status,
    bhk: sp.bhk,
    min: sp.min,
    max: sp.max,
    q: sp.q,
    sort: sp.sort,
  };

  const [results, facets] = await Promise.all([searchListings(query), getFacets()]);

  const scope = [
    sp.q ? `"${sp.q}"` : null,
    sp.bhk ? `${sp.bhk} BHK` : null,
    sp.locality ?? sp.city ?? null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {results.length} {results.length === 1 ? "project" : "projects"}
              {scope ? <span className="dim font-normal"> for {scope}</span> : null}
            </h1>
            <p className="dim mt-1 text-sm">
              Availability counts are read live from builder inventory.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[260px_1fr]">
          <ListingFilters facets={facets} />

          <div>
            {results.length === 0 ? (
              <div className="surface rounded-xl border hairline p-10 text-center shadow-sm">
                <p className="font-medium">Nothing matches those filters.</p>
                <p className="dim mt-1 text-sm">
                  Try widening the budget, or clearing the locality.
                </p>
                <Link
                  href="/properties"
                  className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
                >
                  Clear all filters
                </Link>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {results.map((p) => (
                  <PropertyCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
