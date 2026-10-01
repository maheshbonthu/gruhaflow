import Link from "next/link";
import PropertyMedia from "./PropertyMedia";
import { inr } from "@/lib/fmt";
import { Badge } from "./ui";

export interface PropertyCardData {
  id: string;
  slug: string;
  name: string;
  builder: string;
  locality: string;
  city: string;
  tagline: string;
  configs: string[];
  priceFrom: number;
  priceTo: number;
  sqftFrom: number;
  sqftTo: number;
  possession: string;
  status: string;
  propertyType: string;
  rating: number;
  availableUnits: number;
}

const STATUS_LABEL: Record<string, string> = {
  UNDER_CONSTRUCTION: "Under construction",
  READY_TO_MOVE: "Ready to move",
  NEW_LAUNCH: "New launch",
};

export default function PropertyCard({ p }: { p: PropertyCardData }) {
  return (
    <article className="surface group overflow-hidden rounded-xl border hairline shadow-sm transition hover:shadow-md">
      <Link href={`/properties/${p.slug}`} className="block">
        <div className="relative h-44 overflow-hidden">
          <PropertyMedia seed={p.slug} label={`${p.name}, ${p.locality}`} className="h-full w-full" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <Badge tone={p.status === "READY_TO_MOVE" ? "good" : p.status === "NEW_LAUNCH" ? "info" : "warn"}>
              {STATUS_LABEL[p.status] ?? p.status}
            </Badge>
          </div>
          <div className="absolute right-3 top-3">
            <span className="rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
              ★ {p.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/properties/${p.slug}`}>
              <h3 className="truncate font-semibold tracking-tight group-hover:underline">{p.name}</h3>
            </Link>
            <p className="dim truncate text-xs">
              {p.locality}, {p.city} · by {p.builder}
            </p>
          </div>
        </div>

        <p className="mt-2.5 text-lg font-semibold">
          {inr(p.priceFrom)} <span className="dim text-sm font-normal">– {inr(p.priceTo)}</span>
        </p>
        <p className="dim text-xs">
          {p.configs.join(", ")} · {p.sqftFrom}–{p.sqftTo} sqft
        </p>

        <p className="mt-2.5 line-clamp-2 text-sm">{p.tagline}</p>

        <dl className="mt-3 grid grid-cols-2 gap-2 border-t hairline pt-3 text-xs">
          <div>
            <dt className="dim">Possession</dt>
            <dd className="font-medium">{p.possession}</dd>
          </div>
          <div>
            <dt className="dim">Units available</dt>
            <dd className="font-medium tabular-nums">{p.availableUnits}</dd>
          </div>
        </dl>

        <Link
          href={`/properties/${p.slug}`}
          className="mt-3 block rounded-lg bg-brand-600 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-brand-700"
        >
          View details & enquire
        </Link>
      </div>
    </article>
  );
}
