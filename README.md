# The Urban Firm

A real-estate platform that covers the whole lifecycle of a home sale, not just
the listing: a **housing-portal front end**, a **tele-calling CRM** behind it, a
**post-booking handover tracker** that runs to Gruha Pravesham, and an
**apartment maintenance desk** for after the family moves in.

The thread that ties it together is a single lead record. A visitor enquires on a
listing page, becomes a lead on a tele-caller's list, gets called, visits the
site, books a unit — and the moment they book, the same person becomes a portal
user who can watch their own handover progress and later raise a plumbing
complaint. Admins see every stage of that; buyers see their own slice of it.

## The four numbers

The dashboard answers the questions this was built for, directly and in order:

| Question | How it is counted |
| --- | --- |
| How many members were **called**? | Leads at or past `CALLED`, including those who were reached and then said no |
| How many are **interested**? | Leads at or past `INTERESTED` |
| How many **really came to the location**? | Site visits actually marked attended — not merely scheduled |
| How many **really bought**? | Leads at stage `BOOKED`, each with a real unit allotted |

Stages are cumulative, so a buyer still counts as called and as interested.
Scheduling a visit and attending one are deliberately separate actions, because
the gap between them is the number most funnels quietly hide.

## The three portals

**Public site** — housing-portal style. Search by city, locality, budget,
configuration, property type and construction stage; project pages carry price
bands, live unit availability, RERA numbers, amenities and a "request a call
back" form that creates a lead and round-robins it to the caller with the
smallest open pipeline.

**Admin / manager console** — the funnel and conversion rates, agent
leaderboard, lead-source performance, call-volume trend, full lead and call
history, site-visit turn-up rates, bookings, the handover tracker, the service
desk, the vendor panel, maintenance billing, project and unit inventory, and the
team/resident directory.

**Tele-call agent portal** — a focused call list. Log a call with an outcome and
a disposition and the lead moves itself down the funnel; book a site visit from
the same form; mark the visit attended; allot a unit to convert the booking.
Agents see their own leads, their own numbers, their due follow-ups and the leads
that are going cold.

**Buyer / resident portal** — their unit, their 16-step handover timeline with
owners and target dates, their construction-linked payment schedule, their
service requests with SLA clocks and a full audit trail, and their monthly
maintenance bills.

## Post-booking handover

Every booking automatically gets the same 16 milestones, each with an owner and a
due date offset from the booking date:

booking confirmed → token receipt → KYC → sale agreement → loan sanctioned →
registration and stamp duty → slab-wise construction → electricity sanction →
water and sewerage → interior design sign-off → interior execution → snag list →
final payment → occupancy certificate → key handover → **Gruha Pravesham**

Completing the last one flips the booking to `HANDED_OVER`, which is the point
the platform switches from tracking construction to running the building.

## Maintenance after move-in

Twelve service categories — electricity, plumbing, interiors, security,
housekeeping, carpentry, pest control, lift, water supply, internet, parking and
a catch-all. Each ticket gets an SLA clock set from its priority at the moment it
is raised (emergency 2h, high 8h, medium 24h, low 72h), a vendor from the matching
trade, and a timeline every update is appended to. Monthly maintenance invoices
are itemised across common-area maintenance, water, security and housekeeping,
lift and DG upkeep, and a corpus contribution.

## Stack

- **Next.js 16** (App Router, React 19, server components)
- **TypeScript** in strict mode
- **MongoDB** via the official driver, with a globally cached connection so
  serverless invocations reuse one pool
- **Tailwind CSS v4**, light and dark, no component library
- **jose** for JWT session cookies, **bcryptjs** for password hashing, **zod**
  for request validation
- Charts and listing artwork are hand-rolled SVG — no chart library, no image CDN

## Running it locally

```bash
npm install
cp .env.example .env.local     # then fill in MONGODB_URI
npm run devdb                  # optional: throwaway local MongoDB on :27017
npm run seed                   # build the demo dataset
npm run dev                    # http://localhost:3000
```

`npm run devdb` starts an in-process MongoDB so you can run the whole thing
without Atlas or Docker. It keeps nothing when it stops. For anything real, point
`MONGODB_URI` at an Atlas cluster (the free M0 tier is enough).

### Environment

| Variable | Required | What it is |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection string |
| `MONGODB_DB` | no | Database name, defaults to `urbanfirm` |
| `AUTH_SECRET` | yes | Long random string used to sign session JWTs |
| `SEED_TOKEN` | yes, to seed | Guards `POST /api/seed` |

### Seeding a deployed instance

There is no `GET` handler on the seed route, so a crawler cannot wipe the
database:

```bash
curl -X POST "https://<your-deployment>/api/seed" -H "x-seed-token: $SEED_TOKEN"
```

The seeder is destructive and idempotent — it clears every collection and
rebuilds the same dataset from a fixed PRNG seed, so the demo numbers are
identical every time.

## Demo logins

Every seeded account uses the password `demo1234`.

| Role | Email | Lands on |
| --- | --- | --- |
| Administrator | `admin@theurbanfirm.in` | Full console |
| Sales manager | `manager@theurbanfirm.in` | Full console |
| Tele-call agent | `priya@theurbanfirm.in` | Own call list |
| Tele-call agent | `sunil@theurbanfirm.in` | Own call list |
| Buyer / resident | any email under Admin → Team & residents | Own home tracker |

The seeded buyers are leads that converted, so each is at a different handover
stage with a different set of tickets and bills. Pick one from the residents
table to see a half-finished handover; pick another to see a flat already past
Gruha Pravesham and into maintenance.

## What is deliberately not here

- **No payment gateway.** Marking an instalment or a maintenance bill paid
  records a receipt; no money moves.
- **No telephony integration.** Calls are logged by the agent after the fact
  rather than dialled from the browser, so there is no click-to-call or
  recording.
- **No file uploads.** Documents and construction photos are referenced in the
  milestone notes rather than stored.
- **No real listings.** Every project, lead, buyer and ticket is synthetic sample
  data.

## Project layout

```
src/
  app/
    page.tsx              public home with the search hero
    properties/           listing search and project detail pages
    login/
    admin/                console: dashboard, leads, visits, bookings,
                          handover, services, vendors, billing, inventory, people
    agent/                call list, lead workspace, own site visits
    portal/               buyer: home, journey, payments, services, bills
    api/                  auth, enquiry, leads, calls, visits, bookings,
                          journey, services, invoices, seed
  components/             shared UI kit, shell, nav, listing cards, SVG media
  lib/
    types.ts              stage order, journey definition, SLA table, entities
    mongodb.ts            cached client, typed collections, indexes
    auth.ts               hashing, JWT sessions, role guards
    metrics.ts            the funnel, leaderboard, ops summary, call trend
    queries.ts            joined read models for the pages
    listings.ts           public search, facets, project detail
    booking.ts            lead to booking conversion, journey and payment plan
    seed.ts               the demo dataset
middleware.ts             edge role gate for /admin, /agent, /portal
```

## Licence

MIT.
