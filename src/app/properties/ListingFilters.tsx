"use client";

import { useRouter, useSearchParams } from "next/navigation";

const BUDGETS: Array<{ label: string; min?: string; max?: string }> = [
  { label: "Any" },
  { label: "Under ₹50 L", max: "5000000" },
  { label: "₹50 L – ₹1 Cr", min: "5000000", max: "10000000" },
  { label: "₹1 Cr – ₹2 Cr", min: "10000000", max: "20000000" },
  { label: "Above ₹2 Cr", min: "20000000" },
];

const TYPES: Array<[string, string]> = [
  ["ALL", "Any type"],
  ["APARTMENT", "Apartment"],
  ["VILLA", "Villa"],
  ["PENTHOUSE", "Penthouse"],
  ["PLOT", "Plot"],
];

const STATUSES: Array<[string, string]> = [
  ["ALL", "Any stage"],
  ["READY_TO_MOVE", "Ready to move"],
  ["UNDER_CONSTRUCTION", "Under construction"],
  ["NEW_LAUNCH", "New launch"],
];

const SORTS: Array<[string, string]> = [
  ["featured", "Recommended"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
];

export default function ListingFilters({
  facets,
}: {
  facets: { cities: string[]; localities: Array<{ city: string; locality: string; count: number }> };
}) {
  const router = useRouter();
  const params = useSearchParams();

  function set(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value && value !== "ALL") next.set(key, value);
      else next.delete(key);
    }
    router.push(`/properties?${next.toString()}`);
  }

  const control =
    "surface w-full rounded-lg border hairline px-3 py-2 text-sm outline-none focus:border-brand-500";
  const activeBudget = BUDGETS.findIndex(
    (b) => (b.min ?? "") === (params.get("min") ?? "") && (b.max ?? "") === (params.get("max") ?? "")
  );

  // Localities are offered only for the selected city, like a real portal.
  const city = params.get("city");
  const localities = city ? facets.localities.filter((l) => l.city === city) : facets.localities;

  return (
    <aside className="surface h-fit rounded-xl border hairline p-4 shadow-sm lg:sticky lg:top-20">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters</h2>
        <button
          onClick={() => router.push("/properties")}
          className="text-brand-600 dark:text-brand-300 text-xs hover:underline"
        >
          Clear all
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="f-sort" className="dim mb-1.5 block text-xs font-medium uppercase tracking-wide">
            Sort by
          </label>
          <select
            id="f-sort"
            className={control}
            value={params.get("sort") ?? "featured"}
            onChange={(e) => set({ sort: e.target.value })}
          >
            {SORTS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-city" className="dim mb-1.5 block text-xs font-medium uppercase tracking-wide">
            City
          </label>
          <select
            id="f-city"
            className={control}
            value={city ?? "ALL"}
            onChange={(e) => set({ city: e.target.value, locality: undefined })}
          >
            <option value="ALL">All cities</option>
            {facets.cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-locality" className="dim mb-1.5 block text-xs font-medium uppercase tracking-wide">
            Locality
          </label>
          <select
            id="f-locality"
            className={control}
            value={params.get("locality") ?? "ALL"}
            onChange={(e) => set({ locality: e.target.value })}
          >
            <option value="ALL">All localities</option>
            {localities.map((l) => (
              <option key={`${l.city}-${l.locality}`} value={l.locality}>
                {l.locality} ({l.count})
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="dim mb-1.5 text-xs font-medium uppercase tracking-wide">Budget</legend>
          <div className="space-y-1">
            {BUDGETS.map((b, i) => (
              <button
                key={b.label}
                onClick={() => set({ min: b.min, max: b.max })}
                className={[
                  "block w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition",
                  i === activeBudget ? "bg-brand-600 font-medium text-white" : "hover:surface-2",
                ].join(" ")}
              >
                {b.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="dim mb-1.5 text-xs font-medium uppercase tracking-wide">
            Configuration
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {["1", "2", "3", "4"].map((n) => {
              const active = params.get("bhk") === n;
              return (
                <button
                  key={n}
                  onClick={() => set({ bhk: active ? undefined : n })}
                  className={[
                    "rounded-lg border hairline px-3 py-1.5 text-sm transition",
                    active ? "bg-brand-600 font-medium text-white" : "surface-2 hover:brightness-95",
                  ].join(" ")}
                >
                  {n} BHK
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="f-type" className="dim mb-1.5 block text-xs font-medium uppercase tracking-wide">
            Property type
          </label>
          <select
            id="f-type"
            className={control}
            value={params.get("type") ?? "ALL"}
            onChange={(e) => set({ type: e.target.value })}
          >
            {TYPES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-status" className="dim mb-1.5 block text-xs font-medium uppercase tracking-wide">
            Construction stage
          </label>
          <select
            id="f-status"
            className={control}
            value={params.get("status") ?? "ALL"}
            onChange={(e) => set({ status: e.target.value })}
          >
            {STATUSES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
}
