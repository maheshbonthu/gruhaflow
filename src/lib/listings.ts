import type { Filter } from "mongodb";
import { collections } from "./mongodb";
import type { PropertyCardData } from "@/components/PropertyCard";
import type { ProjectDoc } from "./types";

export interface ListingQuery {
  city?: string;
  locality?: string;
  type?: string;
  status?: string;
  bhk?: string;
  min?: string;
  max?: string;
  q?: string;
  sort?: string;
}

function escapeRx(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Public search over projects, plus a live count of unsold units per project. */
export async function searchListings(query: ListingQuery = {}): Promise<PropertyCardData[]> {
  const projects = await collections.projects();
  const units = await collections.units();

  const filter: Filter<ProjectDoc> = {};
  if (query.city && query.city !== "ALL") filter.city = query.city;
  if (query.locality && query.locality !== "ALL") filter.locality = query.locality;
  if (query.type && query.type !== "ALL") filter.propertyType = query.type as ProjectDoc["propertyType"];
  if (query.status && query.status !== "ALL") filter.status = query.status as ProjectDoc["status"];
  if (query.bhk && query.bhk !== "ALL") {
    filter.configs = { $elemMatch: { $regex: `^${escapeRx(query.bhk)}` } };
  }

  // A project matches a budget window if its own price range overlaps it.
  const min = Number(query.min);
  const max = Number(query.max);
  if (Number.isFinite(min) && min > 0) filter.priceTo = { $gte: min };
  if (Number.isFinite(max) && max > 0) filter.priceFrom = { $lte: max };

  if (query.q?.trim()) {
    const rx = new RegExp(escapeRx(query.q.trim()), "i");
    filter.$or = [{ name: rx }, { builder: rx }, { locality: rx }, { city: rx }, { tagline: rx }];
  }

  const sort: Record<string, 1 | -1> =
    query.sort === "price_asc"
      ? { priceFrom: 1 }
      : query.sort === "price_desc"
        ? { priceFrom: -1 }
        : query.sort === "possession"
          ? { possession: 1 }
          : { featured: -1, rating: -1 };

  const docs = await projects.find(filter).sort(sort).toArray();
  if (!docs.length) return [];

  const counts = await units
    .aggregate<{ _id: unknown; n: number }>([
      { $match: { status: "AVAILABLE", projectId: { $in: docs.map((d) => d._id!) } } },
      { $group: { _id: "$projectId", n: { $sum: 1 } } },
    ])
    .toArray();
  const countMap = new Map(counts.map((c) => [String(c._id), c.n]));

  return docs.map((d) => ({
    id: String(d._id),
    slug: d.slug,
    name: d.name,
    builder: d.builder,
    locality: d.locality,
    city: d.city,
    tagline: d.tagline,
    configs: d.configs,
    priceFrom: d.priceFrom,
    priceTo: d.priceTo,
    sqftFrom: d.sqftFrom,
    sqftTo: d.sqftTo,
    possession: d.possession,
    status: d.status,
    propertyType: d.propertyType,
    rating: d.rating,
    availableUnits: countMap.get(String(d._id)) ?? 0,
  }));
}

/** Distinct cities and localities, for the filter dropdowns. */
export async function getFacets(): Promise<{
  cities: string[];
  localities: Array<{ city: string; locality: string; count: number }>;
}> {
  const projects = await collections.projects();
  const docs = await projects
    .find({})
    .project<{ city: string; locality: string }>({ city: 1, locality: 1 })
    .toArray();

  const cities = [...new Set(docs.map((d) => d.city))].sort();
  const byLocality = new Map<string, { city: string; locality: string; count: number }>();
  for (const d of docs) {
    const key = `${d.city}|${d.locality}`;
    const row = byLocality.get(key) ?? { city: d.city, locality: d.locality, count: 0 };
    row.count += 1;
    byLocality.set(key, row);
  }
  return { cities, localities: [...byLocality.values()].sort((a, b) => b.count - a.count) };
}

export interface ListingDetail {
  project: ProjectDoc & { id: string };
  configs: Array<{
    bhk: number;
    label: string;
    sqftFrom: number;
    sqftTo: number;
    priceFrom: number;
    available: number;
  }>;
  availableUnits: number;
  soldUnits: number;
  similar: PropertyCardData[];
}

export async function getListing(slug: string): Promise<ListingDetail | null> {
  const projects = await collections.projects();
  const units = await collections.units();

  const project = await projects.findOne({ slug });
  if (!project) return null;

  const unitDocs = await units.find({ projectId: project._id }).toArray();

  // Group the real inventory into the configuration table buyers expect.
  const grouped = new Map<number, { sqft: number[]; prices: number[]; available: number }>();
  for (const u of unitDocs) {
    const row = grouped.get(u.bhk) ?? { sqft: [], prices: [], available: 0 };
    row.sqft.push(u.sqft);
    row.prices.push(u.price);
    if (u.status === "AVAILABLE") row.available += 1;
    grouped.set(u.bhk, row);
  }

  const configs = [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bhk, row]) => ({
      bhk,
      label: project.propertyType === "VILLA" ? `${bhk} BHK Villa` : `${bhk} BHK`,
      sqftFrom: Math.min(...row.sqft),
      sqftTo: Math.max(...row.sqft),
      priceFrom: Math.min(...row.prices),
      available: row.available,
    }));

  const similar = await searchListings({ city: project.city });

  return {
    project: { ...project, id: String(project._id) },
    configs,
    availableUnits: unitDocs.filter((u) => u.status === "AVAILABLE").length,
    soldUnits: unitDocs.filter((u) => u.status === "SOLD").length,
    similar: similar.filter((s) => s.slug !== slug).slice(0, 3),
  };
}
