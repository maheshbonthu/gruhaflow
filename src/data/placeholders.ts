/**
 * Every placeholder image in the product, in one list.
 *
 * Nothing else may hard-code a stock photo URL. Each entry carries its source
 * page and photographer so the credits are auditable, and `PlaceholderImage`
 * shows a visible "placeholder" tag in development builds only — so they are
 * obvious while building and invisible in production, but still findable here
 * at launch.
 *
 * To replace one: swap `src` for the real asset, set `replaced: true`, and keep
 * the row. `npm run placeholders` lists what is still outstanding.
 */

export interface Placeholder {
  /** Stable key referenced from components. */
  id: string;
  /** Where it is used, in plain words. */
  usage: string;
  /** Image URL, currently a stock photo. */
  src: string;
  /** Required alt text. Describe the image, not the brand. */
  alt: string;
  source: "unsplash" | "pexels" | "none";
  /** Link to the photo page, for licence verification. */
  sourceUrl: string;
  photographer: string;
  /** Flip to true once a real asset is in place. */
  replaced: boolean;
}

/**
 * Unsplash and Pexels both permit commercial use without attribution, but we
 * record the photographer anyway so credits can be published if you choose to,
 * and so each file can be traced back to its licence.
 */
export const PLACEHOLDERS: Placeholder[] = [
  {
    id: "hero-buy",
    usage: "Home hero background — Buy tab",
    src: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&q=70&fm=webp",
    alt: "City apartment towers at dusk with lit windows",
    source: "unsplash",
    sourceUrl: "https://unsplash.com/photos/1DQmrg3F7pM",
    photographer: "Sean Pollock",
    replaced: false,
  },
  {
    id: "hero-rent",
    usage: "Home hero background — Rent tab",
    src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1920&q=70&fm=webp",
    alt: "Bright furnished living room with a sofa and large windows",
    source: "unsplash",
    sourceUrl: "https://unsplash.com/photos/fZuleEfeA1Q",
    photographer: "Patrick Perkins",
    replaced: false,
  },
  {
    id: "hero-commercial",
    usage: "Home hero background — Commercial tab",
    src: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=70&fm=webp",
    alt: "Open-plan office interior with desks and glass partitions",
    source: "unsplash",
    sourceUrl: "https://unsplash.com/photos/jrh5lAq-mIs",
    photographer: "Nastuh Abootalebi",
    replaced: false,
  },
  {
    id: "hero-pg",
    usage: "Home hero background — PG / Co-living tab",
    src: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1920&q=70&fm=webp",
    alt: "Shared living space with young people seated around a table",
    source: "unsplash",
    sourceUrl: "https://unsplash.com/photos/ZtgPbJT7eRY",
    photographer: "Toa Heftiba",
    replaced: false,
  },
  {
    id: "hero-plots",
    usage: "Home hero background — Plots tab",
    src: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=70&fm=webp",
    alt: "Open green land under a clear sky",
    source: "unsplash",
    sourceUrl: "https://unsplash.com/photos/mQVWb7kwaFo",
    photographer: "Federico Respini",
    replaced: false,
  },
  {
    id: "service-property-management",
    usage: "Services card — Property Management",
    src: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=70&fm=webp",
    alt: "Residential building exterior with balconies",
    source: "unsplash",
    sourceUrl: "https://unsplash.com/photos/L7en7Lb-Ovc",
    photographer: "Breno Assis",
    replaced: false,
  },
  {
    id: "service-site-development",
    usage: "Services card — Site Development",
    src: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&q=70&fm=webp",
    alt: "Construction site with a building under development",
    source: "unsplash",
    sourceUrl: "https://unsplash.com/photos/XGvwt544g8k",
    photographer: "Avel Chuklanov",
    replaced: false,
  },
  {
    id: "service-interiors",
    usage: "Services card — Interiors",
    src: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=70&fm=webp",
    alt: "Modern living room interior with neutral furnishing",
    source: "unsplash",
    sourceUrl: "https://unsplash.com/photos/nJdwUHmaY8A",
    photographer: "Spacejoy",
    replaced: false,
  },
  {
    id: "service-home-services",
    usage: "Services card — Home Services",
    src: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=70&fm=webp",
    alt: "Person carrying out household maintenance work",
    source: "unsplash",
    sourceUrl: "https://unsplash.com/photos/mG28olYFgHI",
    photographer: "CDC",
    replaced: false,
  },
];

export const PLACEHOLDER_MAP: Record<string, Placeholder> = Object.fromEntries(
  PLACEHOLDERS.map((p) => [p.id, p])
);

export function getPlaceholder(id: string): Placeholder | undefined {
  return PLACEHOLDER_MAP[id];
}

export function outstandingPlaceholders(): Placeholder[] {
  return PLACEHOLDERS.filter((p) => !p.replaced);
}
