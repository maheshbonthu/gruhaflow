# Phase 1 — Audit & Plan

**Status:** awaiting your approval before any code is written.
**Scope:** redesign the public-facing site to Housing.com-grade UX, on top of the existing GruhaFlow codebase.

---

## 0. Assumptions I had to make

The brief arrived with its `[PLACEHOLDER]` values unfilled. I inferred the following from our existing work rather than blocking. **Correct anything wrong before I start Phase 2** — three of these change the design system itself.

| Placeholder | Assumed | Confidence |
| --- | --- | --- |
| `[BRAND NAME]` | GruhaFlow | Medium — this was my working name, not necessarily yours |
| `[CITY]` | Hyderabad | High — it is the primary city in the seeded data |
| `[EXISTING SITE URL]` | https://gruhaflow.vercel.app | High |
| `[REPO PATH]` | `C:\dev\gruhaflow` → github.com/maheshbonthu/gruhaflow | High |
| `[PRIMARY HEX]` / `[SECONDARY HEX]` | Not supplied — see §6, this is the biggest open decision | **Low** |
| `[LOGO FILE]` | None supplied; currently a "GF" lettermark in a rounded square | Low |

---

## 1. Phase 0 — skill installation

| Skill | Status | Notes |
| --- | --- | --- |
| Anthropic `frontend-design` | ✅ Installed | `.claude/skills/frontend-design/` |
| UI UX Pro Max | ✅ Installed | `.claude/skills/` — brings 7 skills (`ui-ux-pro-max`, `design-system`, `ui-styling`, `brand`, `design`, `banner-design`, `slides`) |

**One partial failure, as the brief asked me to report.** UI UX Pro Max ships a Python search tool (`scripts/search.py`) and Python is not installed on this machine (`python`, `python3` and `py` all fail). Its knowledge base is plain CSV, so I queried it directly with Node instead and got the data out intact. Nothing is lost, but if you want the skill's own CLI working, install Python 3.

What the skill data actually returned for our product type:

- **Palette profile #36 "Real Estate/Property"** — primary `#0F766E` (teal), secondary `#14B8A6`, accent `#0369A1` (blue). Its note: *"Trust teal + professional blue."*
- **Landing pattern #22 "Marketplace / Directory"** — section order `Hero (search focused) → Categories → Featured listings → Trust/Safety → CTA`, with the primary CTA in the hero search bar. This matches the reference almost exactly and validates §3.3.
- **Typography** — the skill's "Real Estate Luxury" pairing (Cinzel + Josefin Sans) I am going to **reject**: Cinzel is an all-caps Roman display face, unusable for dense listing cards and bad for Indian numerals like ₹1,39,00,000. Its "Corporate Trust" pairing (**Lexend** + Source Sans 3) is the better fit — Lexend is designed specifically for reading ease. The skill's own instructions say to treat results as recommendations and verify fit, so this is a deliberate override, not an oversight.

I also extracted 20 frames from `housing.com.mp4` (ffmpeg run locally, no system install) and reviewed them. The video confirmed three behaviours the stills don't show: the **hero background image and search-button colour change per tab** (Plots → green button, city dropdown moves inside the bar; Commercial → blue office scene with a Buy/Lease radio), the **mega-menu left column highlights on hover** while the other three columns stay static, and the **map/list split loads the list first, map second**.

---

## 2. What exists today

A working Next.js 16 application, deployed and verified against MongoDB Atlas.

```
25 pages · 14 API routes · ~10,400 lines TS/TSX · 14 Mongo collections
```

**Stack:** Next.js 16 (App Router, RSC) · TypeScript strict · Tailwind CSS v4 · MongoDB (official driver, cached pool) · jose JWT sessions + edge middleware · zod · bcryptjs. No UI library, no map library, no image pipeline, no CMS, no animation library.

**Route inventory**

| Area | Routes | Verdict |
| --- | --- | --- |
| Public | `/`, `/properties`, `/properties/[slug]`, `/login` | **Rebuild** — this is the redesign |
| Admin console | 10 routes under `/admin` | **Keep** — out of scope, do not touch |
| Agent portal | 4 routes under `/agent` | **Keep** |
| Buyer portal | 5 routes under `/portal` | **Keep**, minor restyle for brand consistency |
| API | 14 routes | **Keep**, extend |

**Seeded data:** 8 projects, 1,596 units, 420 leads, 1,414 calls, 26 bookings, 55 tickets, 104 invoices.

---

## 3. Honest gap analysis against §3

This is the part worth your attention. The brief describes a **multi-vertical property marketplace**. What exists is a **new-build sales CRM with a thin listings front end**. The admin/agent/buyer machinery is strong and reusable; the public side is roughly 20% of what §3 specifies.

### 3.1 Data model gaps — the real work

The current model is `Project → Unit`, which only expresses **new-build apartments for sale**. §3 requires five verticals:

| Vertical | Supported today? | What is missing |
| --- | --- | --- |
| Buy (new build) | ✅ Yes | — |
| Buy (resale) | ❌ No | Owner-listed individual properties, not tied to a project |
| **Rent** | ❌ No | Monthly rent, deposit, furnishing, tenant preferences, availability date |
| **Commercial** | ❌ No | Buy *and* lease modes, carpet vs built-up, floor plate, office/retail/warehouse |
| **PG / Co-living** | ❌ No | Per-bed pricing, sharing type, gender, food, house rules, brand operator |
| **Plots** | ⚠️ Partial | Modelled as a unit with `bhk`, which is meaningless for land |

Other structural gaps:

- **No geo coordinates.** The map split view (§3.4) is impossible without `lat`/`lng` on every listing and a locality polygon. This is the single biggest missing field.
- **No `Locality` entity.** Needed for the hotspots carousel, price trends, boundary polygons, locality chips and the SEO footer grid.
- **No price history.** "₹9.9K/sq.ft ▼4.83% (3yrs)" needs a time series we do not store.
- **No images.** `PropertyMedia.tsx` generates an SVG skyline from a hash. It was the right call for a demo with no assets, but §3.5's gallery modal with BEDROOM/BATHROOM/KITCHEN tabs needs real categorised photos.
- **No agent/builder profile entity** for the "Verified Agent" card footer.
- **No amenities per listing** (only per project).

### 3.2 UI gaps

Everything in §3.1 (mega menus), §3.2 (tabbed hero with per-tab backgrounds and autocomplete), §3.4 (filter bar, map split, property cards), §3.5 (gallery modal), §3.6 (service pages), §3.7 (blog) and §3.8 (footer SEO grid) does not exist. The current public site has a search hero, a filter sidebar, basic cards and a project page.

### 3.3 Business-line gaps

The brief names four business lines. Today: **property sales** ✅, **property management** ⚠️ (the maintenance desk is real but has no public-facing page), **site development** ❌, **interiors & home services** ❌. §3.6 needs four full landing pages with lead forms, and the leads must land in the existing CRM.

### 3.4 Non-functional gaps

- **URLs.** Today `/properties/[slug]`. §6 wants `/buy/flats-in-kukatpally-hyderabad`. Changing this needs **301 redirects** — flagged under the brief's own preservation rule.
- **No JSON-LD, sitemap.xml, robots.txt, or Open Graph tags.**
- **No `next/image`.** All imagery is inline SVG today.
- **Fonts** are system stack; §6 wants self-hosted with `font-display: swap`.

---

## 4. Stack recommendation

Keep the existing stack. It is already the one §1 would have proposed, and it is deployed and working. Three additions:

| Addition | Why | Risk |
| --- | --- | --- |
| **MapLibre GL + OpenFreeMap tiles** | Map split view. MapLibre is open-source; OpenFreeMap needs no API key and has no bill. | Low. Code-split so it loads only on listing pages. |
| **Framer Motion** | Mega menus, tab cross-fade, gallery modal, carousels — with `prefers-reduced-motion` support built in. | Low. ~34KB gzipped. |
| **Lucide icons** | §5 asks for one consistent line set. | None. Tree-shaken. |

**I am not adding shadcn/ui.** §1 offered it, but we already have a hand-built component kit (`src/components/ui.tsx`) matched to this codebase, and shadcn would mean two parallel systems. I would rather extend what is there. Tell me if you disagree.

**No Google Maps**, because §6's rule says ask before adding a paid API key. If you want Google's tiles and Indian locality data specifically, say so and supply a key.

---

## 5. Proposed build order

Phase 2 (design system + `/styleguide`) → then pages in §3's order:

1. **Global header + mega menus + footer** — every page depends on them
2. **Home** — hero with 5 tabs, hotspots, recently added, services, why-us, guides
3. **Search results** — filter bar, cards, list/map split
4. **Property detail + gallery modal**
5. **Four service landing pages**
6. **Blog / News & Guide**
7. **Post Property / Contact**
8. **SEO link pages, sitemap, JSON-LD**

Each page ships as its own commit with desktop + mobile screenshots compared against your reference stills.

### Component inventory (~38 new components)

`SiteHeader` · `CitySelector` · `MegaMenu` · `MegaMenuColumn` · `MobileDrawer` · `HeroTabs` · `HeroSearch` · `Autocomplete` · `LocalityChips` · `OwnerPill` · `CampaignBanner` · `HotspotCard` · `PriceTrend` · `Carousel` · `PropertyCard` · `CardGallery` · `SaveButton` · `ShareButton` · `FilterBar` · `FilterPill` · `RangeFilter` · `SortSelect` · `ResultsHeader` · `Breadcrumb` · `MapView` · `PriceMarker` · `MarkerCluster` · `LocalityPolygon` · `ListMapToggle` · `PromoCard` · `SkeletonCard` · `EmptyState` · `GalleryModal` · `GalleryTabs` · `AmenityGrid` · `EmiCalculator` · `StickyContactCard` · `ServiceHero` · `FaqAccordion` · `ArticleCard` · `SeoLinkTabs` · `SiteFooter`

---

## 6. Decisions I need from you

**These three block Phase 2.**

### ① Brand colours — there is a conflict in the brief

§5 gives a default `--primary` of **deep violet #5B2EE5**. That is very close to Housing.com's own brand violet, and §REFERENCE explicitly says *"Do NOT copy ... their exact color scheme."* Following the default would violate the rule.

Three options:

- **(a) Trust teal — my recommendation.** `#0F766E` primary with a `#0369A1` blue accent, straight from the UI UX Pro Max Real Estate profile. Distinct from every major Indian portal (Housing violet, 99acres red, MagicBricks red, NoBroker blue-green). Reads as trustworthy and legal-grade, which suits a company that also does registration and property management.
- **(b) Your actual brand colours.** Send the hexes and I will build the scale around them, keeping §5's roles and WCAG AA contrast.
- **(c) Violet anyway**, accepting the resemblance.

### ② Brand name and logo
Is "GruhaFlow" the real name? If not, tell me the name and send the logo file; it affects the wordmark, the header lockup and the favicon.

### ③ Scope of the data model rebuild
This is a fork in the road:

- **Narrow** — redesign the UI for the verticals we already have (buy new-build + plots). Fast, honest, the map still works. The Rent/Commercial/PG tabs would be visible but empty.
- **Full** — extend the model to all five verticals with geo coordinates, localities, price history and real images, then redesign. Significantly more work but matches §3 as written.

I recommend **Full for the data model, phased by vertical**: add `Locality` + geo + images first (these unblock the map, hotspots and gallery, which are the most visible parts of the reference), then Rent, then PG, then Commercial.

**Two smaller confirmations:** may I use Unsplash/Pexels placeholder photography, clearly marked for replacement (§REFERENCE permits it)? And are the trust numbers real — the hero needs a "6K+ listings daily, 78K+ verified" equivalent, and I will not invent statistics about your business.

---

## 7. Risks

| Risk | Mitigation |
| --- | --- |
| **Fabricated trust claims.** "Verified", "zero brokerage", RERA numbers and award badges are legal claims in India. | I will not write any claim you have not confirmed. Placeholders stay visibly marked. |
| **URL changes break existing SEO.** | Every changed route gets a 301. I will list all of them for approval before switching. |
| **Map performance on mobile.** | Code-split MapLibre, load on interaction, cluster markers server-side. |
| **Empty verticals look broken.** | If you choose Narrow scope, unsupported tabs get an honest "coming soon" state rather than a zero-results page. |
| **Lighthouse ≥90 with a map.** | Map lives only on listing routes; home and detail pages stay light. Hero images budgeted under 200KB AVIF. |
| **Scope.** §3 is a large build — realistically 7 substantial phases. | Shipping in the §5 order means you get a usable site after each one. |

---

## 8. What I did not touch

No code was changed in this phase, per §1. The only files added are the two skills under `.claude/skills/` and this document. The admin, agent and buyer portals are untouched and still working; the live site is unchanged.
