"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const BUDGETS = [
  { label: "Any budget", value: "" },
  { label: "Under ₹50 L", value: "0-5000000" },
  { label: "₹50 L – ₹1 Cr", value: "5000000-10000000" },
  { label: "₹1 Cr – ₹2 Cr", value: "10000000-20000000" },
  { label: "Above ₹2 Cr", value: "20000000-0" },
];

/** The hero search. Writes its state into the /properties query string. */
export default function SearchBar({
  cities,
  big = false,
}: {
  cities: string[];
  big?: boolean;
}) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState("");
  const [q, setQ] = useState("");

  function search(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (q.trim()) params.set("q", q.trim());
    if (budget) {
      const [min, max] = budget.split("-");
      if (min && min !== "0") params.set("min", min);
      if (max && max !== "0") params.set("max", max);
    }
    router.push(`/properties?${params.toString()}`);
  }

  const control =
    "surface rounded-lg border hairline px-3 py-2.5 text-sm outline-none focus:border-brand-500";

  return (
    <form
      onSubmit={search}
      className={[
        "surface grid gap-2 rounded-xl border hairline p-2 shadow-sm",
        big ? "sm:grid-cols-[1.4fr_1fr_1fr_auto]" : "sm:grid-cols-[1fr_auto]",
      ].join(" ")}
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by project, builder or locality"
        aria-label="Search by project, builder or locality"
        className={control}
      />

      {big && (
        <>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label="City"
            className={control}
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            aria-label="Budget"
            className={control}
          >
            {BUDGETS.map((b) => (
              <option key={b.label} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </>
      )}

      <button
        type="submit"
        className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        Search
      </button>
    </form>
  );
}
