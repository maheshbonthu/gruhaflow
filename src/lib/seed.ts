import { ObjectId } from "mongodb";
import { collections, ensureIndexes, getDb } from "./mongodb";
import { hashPassword } from "./auth";
import { buildJourney, buildPayments, bookingCode } from "./booking";
import {
  CALL_DISPOSITIONS,
  CATEGORY_LABELS,
  JOURNEY_STEPS,
  LEAD_SOURCES,
  SERVICE_CATEGORIES,
  SLA_HOURS,
  type AnyStage,
  type CallDisposition,
  type CallOutcome,
  type LeadDoc,
  type Priority,
  type ProjectDoc,
  type ServiceCategory,
  type TicketStatus,
} from "./types";

/** Deterministic PRNG so every seed produces the same demo numbers. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const rand = rng(20261001);

/** Day offset of each handover step, read straight off the canonical list. */
const STEP_DAYS: number[] = JOURNEY_STEPS.map((s) => s.days);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(between(9, 19), between(0, 59), 0, 0);
  return d;
};
const addDays = (from: Date, n: number) => {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return d;
};

const FIRST = [
  "Ravi", "Sridevi", "Anil", "Lakshmi", "Praveen", "Kavitha", "Suresh", "Divya",
  "Mahesh", "Swapna", "Naveen", "Padma", "Kiran", "Sunitha", "Vijay", "Jyothi",
  "Rajesh", "Madhavi", "Srikanth", "Anitha", "Harish", "Deepika", "Venkat",
  "Sowmya", "Prasad", "Rekha", "Chandra", "Bhavani", "Ramesh", "Geetha",
  "Arjun", "Nikhila", "Sandeep", "Keerthi", "Mohan", "Vandana", "Karthik",
  "Shilpa", "Gopal", "Aruna",
];
const LAST = [
  "Reddy", "Rao", "Sharma", "Naidu", "Kumar", "Varma", "Chowdary", "Prasad",
  "Goud", "Yadav", "Shetty", "Murthy", "Babu", "Krishna", "Patel",
];

function personName(i: number): string {
  return `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`;
}

function phone(i: number): string {
  return `9${String(800000000 + i * 137711).slice(0, 9)}`;
}

/**
 * The shape of the demo funnel. Weights are tuned so the dashboard shows a
 * believable drop-off rather than a flat distribution.
 */
const STAGE_MIX: Array<[AnyStage, number]> = [
  ["NEW", 58],
  ["CALLED", 46],
  ["UNREACHABLE", 31],
  ["NOT_INTERESTED", 74],
  ["INTERESTED", 63],
  ["SITE_VISIT_SCHEDULED", 38],
  ["SITE_VISITED", 44],
  ["NEGOTIATION", 23],
  ["LOST", 17],
  ["BOOKED", 26],
];

export interface SeedSummary {
  users: number;
  projects: number;
  units: number;
  leads: number;
  calls: number;
  visits: number;
  bookings: number;
  journeySteps: number;
  payments: number;
  vendors: number;
  tickets: number;
  invoices: number;
}

/**
 * Wipes and rebuilds the demo dataset. Destructive by design — it is the
 * "reset the demo" button, and the API route behind it requires SEED_TOKEN.
 */
export async function seedDatabase(): Promise<SeedSummary> {
  const db = await getDb();
  for (const name of [
    "users", "projects", "units", "leads", "calls", "visits", "bookings",
    "journeySteps", "payments", "vendors", "tickets", "invoices",
  ]) {
    await db.collection(name).deleteMany({});
  }
  await ensureIndexes();

  const users = await collections.users();
  const projectsCol = await collections.projects();
  const unitsCol = await collections.units();
  const leadsCol = await collections.leads();
  const callsCol = await collections.calls();
  const visitsCol = await collections.visits();
  const bookingsCol = await collections.bookings();
  const journeyCol = await collections.journey();
  const paymentsCol = await collections.payments();
  const vendorsCol = await collections.vendors();
  const ticketsCol = await collections.tickets();
  const invoicesCol = await collections.invoices();

  /* ------------------------------------------------------------- staff */

  const staffSeed = [
    { name: "Aarthi Menon", email: "admin@gruhaflow.app", role: "ADMIN" as const },
    { name: "Vikram Shetty", email: "manager@gruhaflow.app", role: "MANAGER" as const },
    { name: "Priya Reddy", email: "priya@gruhaflow.app", role: "AGENT" as const },
    { name: "Sunil Kumar", email: "sunil@gruhaflow.app", role: "AGENT" as const },
    { name: "Fatima Khan", email: "fatima@gruhaflow.app", role: "AGENT" as const },
    { name: "Rahul Verma", email: "rahul@gruhaflow.app", role: "AGENT" as const },
  ];

  const staffIds: ObjectId[] = [];
  for (let i = 0; i < staffSeed.length; i++) {
    const s = staffSeed[i];
    const res = await users.insertOne({
      name: s.name,
      email: s.email,
      phone: `98490${String(10000 + i * 913).slice(0, 5)}`,
      passwordHash: hashPassword("demo1234"),
      role: s.role,
      active: true,
      createdAt: daysAgo(400),
    });
    staffIds.push(res.insertedId);
  }
  // Callers who get leads assigned: the manager plus the four agents.
  const callerIds = staffIds.slice(1);

  /* ---------------------------------------------------------- projects */

  const projectSeed: ProjectDoc[] = [
    {
      name: "Aurum Residences",
      slug: "aurum-residences-gachibowli",
      builder: "Aurum Developers",
      city: "Hyderabad",
      locality: "Gachibowli",
      address: "Survey 112, Nanakramguda Road, Gachibowli, Hyderabad 500032",
      tagline: "Premium 3 & 4 BHK towers minutes from the Financial District",
      about:
        "Aurum Residences is a 240-unit gated development spread across 6.2 acres in Gachibowli, built for families who work in the Financial District and want the commute measured in minutes, not hours. Three towers of G+10 sit around a central landscaped spine, with the clubhouse and rooftop pool on the north block.",
      propertyType: "APARTMENT",
      status: "UNDER_CONSTRUCTION",
      totalUnits: 240,
      priceFrom: 9_500_000,
      priceTo: 21_000_000,
      sqftFrom: 1180,
      sqftTo: 2460,
      pricePerSqft: 8200,
      configs: ["2 BHK", "3 BHK", "4 BHK"],
      possession: "Dec 2027",
      rera: "P02400004521",
      rating: 4.5,
      amenities: ["Clubhouse", "Rooftop pool", "Gym", "EV charging", "Kids play area", "Co-working lounge", "Indoor games", "Landscaped garden"],
      highlights: ["8 mins to Financial District", "RERA registered", "80% open space", "Vaastu compliant"],
      featured: true,
    },
    {
      name: "Vaishnavi Greenwoods",
      slug: "vaishnavi-greenwoods-kokapet",
      builder: "Vaishnavi Group",
      city: "Hyderabad",
      locality: "Kokapet",
      address: "Plot 9, Kokapet Neopolis Layout, Hyderabad 500075",
      tagline: "Low-density 2 & 3 BHK homes wrapped in 4 acres of green",
      about:
        "Greenwoods trades tower height for breathing room: 180 homes across six low-rise blocks, with a jogging track that loops the entire perimeter and an amphitheatre at the centre. Kokapet's Neopolis layout puts the ORR exit within two kilometres.",
      propertyType: "APARTMENT",
      status: "UNDER_CONSTRUCTION",
      totalUnits: 180,
      priceFrom: 7_200_000,
      priceTo: 14_500_000,
      sqftFrom: 1050,
      sqftTo: 1980,
      pricePerSqft: 7400,
      configs: ["2 BHK", "3 BHK"],
      possession: "Jun 2027",
      rera: "P02400004722",
      rating: 4.3,
      amenities: ["Clubhouse", "Jogging track", "Amphitheatre", "Yoga deck", "Pet park", "Swimming pool", "Library"],
      highlights: ["2 km to ORR exit", "Low-density layout", "Pet friendly", "Rainwater harvesting"],
      featured: true,
    },
    {
      name: "Sattva Lake Vista",
      slug: "sattva-lake-vista-whitefield",
      builder: "Sattva Builders",
      city: "Bengaluru",
      locality: "Whitefield",
      address: "Varthur Main Road, Whitefield, Bengaluru 560066",
      tagline: "Lake-facing 2, 3 & 4 BHK apartments with a 40,000 sqft clubhouse",
      about:
        "Lake Vista's east block looks directly over Varthur lake, and the development reserves its entire ninth floor for resident amenities. 320 units across four towers, with Whitefield's tech parks and the metro line both inside a four-kilometre radius.",
      propertyType: "APARTMENT",
      status: "UNDER_CONSTRUCTION",
      totalUnits: 320,
      priceFrom: 8_800_000,
      priceTo: 19_500_000,
      sqftFrom: 1120,
      sqftTo: 2280,
      pricePerSqft: 8650,
      configs: ["2 BHK", "3 BHK", "4 BHK"],
      possession: "Mar 2028",
      rera: "PRM/KA/RERA/1251/309",
      rating: 4.6,
      amenities: ["Lake view deck", "Indoor badminton", "Swimming pool", "Creche", "Solar backup", "Clubhouse", "Gym", "Squash court"],
      highlights: ["Lake-facing units", "40,000 sqft clubhouse", "Near Whitefield metro", "100% power backup"],
      featured: true,
    },
    {
      name: "Nirvana Heights",
      slug: "nirvana-heights-hinjewadi",
      builder: "Nirvana Realty",
      city: "Pune",
      locality: "Hinjewadi",
      address: "Phase 2, Hinjewadi IT Park Road, Pune 411057",
      tagline: "Ready-to-move 2 & 3 BHK in the heart of Hinjewadi Phase 2",
      about:
        "The only project in this collection with keys already being handed over. 150 homes in two towers, walking distance from Hinjewadi Phase 2 office campuses, with a sky lounge on the top floor of each tower.",
      propertyType: "APARTMENT",
      status: "READY_TO_MOVE",
      totalUnits: 150,
      priceFrom: 6_400_000,
      priceTo: 12_900_000,
      sqftFrom: 980,
      sqftTo: 1760,
      pricePerSqft: 7100,
      configs: ["2 BHK", "3 BHK"],
      possession: "Sep 2026",
      rera: "P52100048812",
      rating: 4.2,
      amenities: ["Sky lounge", "Gym", "Multipurpose hall", "Rainwater harvesting", "Kids play area", "Visitor parking"],
      highlights: ["Ready to move", "Walk to IT park", "OC received", "No GST payable"],
      featured: false,
    },
    {
      name: "Prestige Riverine",
      slug: "prestige-riverine-kompally",
      builder: "Prestige Estates",
      city: "Hyderabad",
      locality: "Kompally",
      address: "Dhulapally Road, Kompally, Hyderabad 500014",
      tagline: "Affordable 2 & 3 BHK with a 1.5 acre central courtyard",
      about:
        "Riverine is the value play of the portfolio: honest 2 and 3 BHK layouts, no wasted corridor space, and a courtyard large enough for a cricket game. Kompally's schools and the Outer Ring Road are both close.",
      propertyType: "APARTMENT",
      status: "NEW_LAUNCH",
      totalUnits: 210,
      priceFrom: 5_200_000,
      priceTo: 9_800_000,
      sqftFrom: 920,
      sqftTo: 1540,
      pricePerSqft: 6200,
      configs: ["2 BHK", "3 BHK"],
      possession: "Aug 2028",
      rera: "P02400005104",
      rating: 4.0,
      amenities: ["Central courtyard", "Gym", "Kids play area", "Community hall", "24x7 security"],
      highlights: ["New launch pricing", "Close to top schools", "Low maintenance", "Bank approved"],
      featured: false,
    },
    {
      name: "Casa Serena Villas",
      slug: "casa-serena-villas-shamirpet",
      builder: "Serena Habitat",
      city: "Hyderabad",
      locality: "Shamirpet",
      address: "Aliabad Village Road, Shamirpet, Hyderabad 500078",
      tagline: "48 independent 4 BHK villas with private plunge pools",
      about:
        "A gated enclave of 48 triplex villas on plots from 3,200 sqft, each with a private plunge pool and a landscaped rear garden. Built around a central clubhouse and an organic farming plot shared by residents.",
      propertyType: "VILLA",
      status: "UNDER_CONSTRUCTION",
      totalUnits: 48,
      priceFrom: 24_000_000,
      priceTo: 38_000_000,
      sqftFrom: 3200,
      sqftTo: 4600,
      pricePerSqft: 9400,
      configs: ["4 BHK Villa"],
      possession: "Nov 2027",
      rera: "P02400004933",
      rating: 4.7,
      amenities: ["Private plunge pool", "Clubhouse", "Organic farm plot", "Home automation", "Servant quarters", "Gated security"],
      highlights: ["Only 48 villas", "Private pool per villa", "Home automation ready", "Near Shamirpet lake"],
      featured: true,
    },
    {
      name: "Brigade Skyline Towers",
      slug: "brigade-skyline-towers-hebbal",
      builder: "Brigade Group",
      city: "Bengaluru",
      locality: "Hebbal",
      address: "Bellary Road, Hebbal, Bengaluru 560024",
      tagline: "3 & 4 BHK sky homes with airport road access",
      about:
        "Two 24-storey towers off Bellary Road, positioned for anyone who flies weekly: the airport expressway entry is three kilometres away. Units start on the fifth floor, so every home has a view over Hebbal lake or the city.",
      propertyType: "APARTMENT",
      status: "UNDER_CONSTRUCTION",
      totalUnits: 280,
      priceFrom: 11_500_000,
      priceTo: 26_000_000,
      sqftFrom: 1380,
      sqftTo: 2740,
      pricePerSqft: 9800,
      configs: ["3 BHK", "4 BHK"],
      possession: "Jul 2028",
      rera: "PRM/KA/RERA/1251/412",
      rating: 4.4,
      amenities: ["Infinity pool", "Sky deck", "Business centre", "Gym", "Spa", "Mini theatre", "Creche"],
      highlights: ["3 km to airport road", "Hebbal lake views", "Sky deck on 24th floor", "Grade-A builder"],
      featured: false,
    },
    {
      name: "Godrej Elina Enclave",
      slug: "godrej-elina-enclave-wakad",
      builder: "Godrej Properties",
      city: "Pune",
      locality: "Wakad",
      address: "Datta Mandir Road, Wakad, Pune 411057",
      tagline: "Compact 1 & 2 BHK homes built for first-time buyers",
      about:
        "Elina is aimed squarely at first-time buyers and investors: efficient 1 and 2 BHK layouts, a single tower of G+14, and a maintenance cost kept deliberately low. Wakad's bus corridor and the Mumbai-Pune expressway are both nearby.",
      propertyType: "APARTMENT",
      status: "NEW_LAUNCH",
      totalUnits: 168,
      priceFrom: 3_900_000,
      priceTo: 7_400_000,
      sqftFrom: 620,
      sqftTo: 1120,
      pricePerSqft: 6600,
      configs: ["1 BHK", "2 BHK"],
      possession: "Apr 2029",
      rera: "P52100049217",
      rating: 4.1,
      amenities: ["Gym", "Rooftop garden", "Kids play area", "Community hall", "Covered parking"],
      highlights: ["Entry from ₹39 L", "First-time buyer friendly", "Low maintenance", "Expressway access"],
      featured: false,
    },
  ];

  const projectIds: ObjectId[] = [];
  for (const p of projectSeed) {
    const res = await projectsCol.insertOne(p);
    projectIds.push(res.insertedId);
  }

  /* ------------------------------------------------------------- units */

  /** Prices a unit by where its size falls inside the project's own range. */
  function priceFor(project: ProjectDoc, sqft: number): number {
    const span = project.sqftTo - project.sqftFrom || 1;
    const t = Math.min(1, Math.max(0, (sqft - project.sqftFrom) / span));
    const raw = project.priceFrom + (project.priceTo - project.priceFrom) * t;
    return Math.round(raw / 10000) * 10000;
  }

  const unitDocs = [];
  for (let p = 0; p < projectIds.length; p++) {
    const project = projectSeed[p];
    const bhkChoices = project.configs.map((c) => parseInt(c, 10)).filter((n) => !Number.isNaN(n));

    if (project.propertyType === "VILLA") {
      // Villas are plotted, not stacked: one row of numbered units, no towers.
      for (let v = 1; v <= project.totalUnits; v++) {
        const sqft = between(project.sqftFrom, project.sqftTo);
        unitDocs.push({
          projectId: projectIds[p],
          tower: "Villa",
          unitNo: `V-${String(v).padStart(2, "0")}`,
          floor: 0,
          bhk: bhkChoices[0] ?? 4,
          sqft,
          price: priceFor(project, sqft),
          facing: pick(["East", "West", "North", "South", "North-East"]),
          status: "AVAILABLE" as const,
        });
      }
      continue;
    }

    const towers = project.totalUnits > 250 ? ["A", "B", "C", "D"] : ["A", "B", "C"];
    const floors = Math.max(4, Math.ceil(project.totalUnits / (towers.length * 2)));
    for (const tower of towers) {
      for (let floor = 1; floor <= floors; floor++) {
        for (const slot of [1, 2]) {
          const bhk = bhkChoices.length
            ? bhkChoices[(floor + slot) % bhkChoices.length]
            : between(2, 3);
          const sqft = Math.min(
            project.sqftTo,
            Math.max(project.sqftFrom, bhk * between(480, 640))
          );
          unitDocs.push({
            projectId: projectIds[p],
            tower,
            unitNo: `${tower}-${floor}0${slot}`,
            floor,
            bhk,
            sqft,
            price: priceFor(project, sqft),
            facing: pick(["East", "West", "North", "South", "North-East"]),
            status: "AVAILABLE" as const,
          });
        }
      }
    }
  }
  await unitsCol.insertMany(unitDocs);
  const allUnits = await unitsCol.find({}).toArray();

  /* ------------------------------------------------------------- leads */

  const stageList: AnyStage[] = [];
  for (const [stage, n] of STAGE_MIX) {
    for (let i = 0; i < n; i++) stageList.push(stage);
  }

  const leadDocs: LeadDoc[] = stageList.map((stage, i) => {
    // Buyers are dated much further back than live leads, otherwise no booking
    // is old enough to have walked the whole 370-day handover checklist and the
    // tracker would show every single one stuck near the start.
    const createdAt = daysAgo(stage === "BOOKED" ? between(45, 470) : between(1, 120));
    const budgetMin = between(60, 130) * 100000;
    const everCalled = stage !== "NEW";
    const lastCallAt = everCalled ? addDays(createdAt, between(0, 5)) : undefined;
    const interested = ["INTERESTED", "SITE_VISIT_SCHEDULED", "SITE_VISITED", "NEGOTIATION", "BOOKED", "LOST"].includes(stage);
    const visited = ["SITE_VISITED", "NEGOTIATION", "BOOKED"].includes(stage);
    return {
      name: personName(i),
      phone: phone(i),
      email: `${personName(i).toLowerCase().replace(/\s+/g, ".")}${i}@example.com`,
      source: pick(LEAD_SOURCES),
      projectId: pick(projectIds),
      assignedAgentId: stage === "NEW" && rand() > 0.6 ? undefined : pick(callerIds),
      stage,
      budgetMin,
      budgetMax: budgetMin + between(20, 60) * 100000,
      notes: stage === "NOT_INTERESTED" ? pick([
        "Budget far below our inventory.",
        "Already booked with another builder.",
        "Looking only for ready-to-move.",
        "Wants a plot, not an apartment.",
      ]) : undefined,
      callCount: everCalled ? between(1, 7) : 0,
      lastCallAt,
      interestedAt: interested ? addDays(createdAt, between(2, 10)) : undefined,
      visitedAt: visited ? addDays(createdAt, between(8, 25)) : undefined,
      bookedAt: stage === "BOOKED" ? addDays(createdAt, between(20, 50)) : undefined,
      createdAt,
      updatedAt: lastCallAt ?? createdAt,
    };
  });

  await leadsCol.insertMany(leadDocs);
  const allLeads = await leadsCol.find({}).toArray();

  /* ------------------------------------------------------------- calls */

  const callDocs = [];
  for (const lead of allLeads) {
    if (!lead.callCount || !lead.assignedAgentId) continue;
    for (let c = 0; c < lead.callCount; c++) {
      const isLast = c === lead.callCount - 1;
      let outcome: CallOutcome = "CONNECTED";
      let disposition: CallDisposition = "NO_DISPOSITION";

      if (lead.stage === "UNREACHABLE") {
        outcome = pick(["NO_ANSWER", "SWITCHED_OFF", "BUSY"] as const);
      } else if (rand() < 0.22) {
        outcome = pick(["NO_ANSWER", "BUSY"] as const);
      }

      if (outcome === "CONNECTED") {
        if (isLast) {
          disposition =
            lead.stage === "NOT_INTERESTED" ? pick(["NOT_INTERESTED", "BUDGET_MISMATCH", "ALREADY_BOUGHT"] as const)
            : lead.stage === "SITE_VISIT_SCHEDULED" || lead.stage === "SITE_VISITED" ? "SITE_VISIT_BOOKED"
            : lead.stage === "INTERESTED" || lead.stage === "NEGOTIATION" || lead.stage === "BOOKED" ? "INTERESTED"
            : pick(CALL_DISPOSITIONS);
        } else {
          disposition = pick(["CALLBACK_LATER", "INTERESTED", "NO_DISPOSITION"] as const);
        }
      }

      callDocs.push({
        leadId: lead._id!,
        agentId: lead.assignedAgentId,
        outcome,
        disposition,
        durationSec: outcome === "CONNECTED" ? between(45, 600) : 0,
        notes: outcome === "CONNECTED" ? pick([
          "Explained the floor plan and payment schedule.",
          "Shared the brochure on WhatsApp.",
          "Asked to call back after discussing with spouse.",
          "Wants a corner unit with East facing.",
          "Comparing with two other projects nearby.",
          "Loan pre-approval already in hand.",
        ]) : undefined,
        nextFollowUpAt: disposition === "CALLBACK_LATER" ? addDays(new Date(), between(1, 6)) : undefined,
        createdAt: addDays(lead.createdAt, c + between(0, 2)),
      });
    }
  }
  await callsCol.insertMany(callDocs);

  /* ------------------------------------------------------------ visits */

  const visitDocs = [];
  for (const lead of allLeads) {
    const scheduled = ["SITE_VISIT_SCHEDULED", "SITE_VISITED", "NEGOTIATION", "BOOKED"].includes(lead.stage);
    if (!scheduled || !lead.assignedAgentId) continue;
    const completed = lead.stage !== "SITE_VISIT_SCHEDULED";
    const scheduledAt = lead.visitedAt ?? addDays(new Date(), between(1, 9));
    visitDocs.push({
      leadId: lead._id!,
      agentId: lead.assignedAgentId,
      projectId: lead.projectId,
      scheduledAt,
      visitedAt: completed ? scheduledAt : undefined,
      status: completed ? ("COMPLETED" as const) : ("SCHEDULED" as const),
      feedback: completed ? pick([
        "Liked the clubhouse, concerned about the commute.",
        "Very happy with the sample flat finish.",
        "Wants to see a higher floor before deciding.",
        "Family approved; discussing the loan now.",
      ]) : undefined,
      rating: completed ? between(3, 5) : undefined,
    });
  }
  // A few no-shows make the visited-vs-scheduled gap honest.
  for (let i = 0; i < 6; i++) {
    const lead = allLeads[between(0, allLeads.length - 1)];
    if (!lead.assignedAgentId) continue;
    visitDocs.push({
      leadId: lead._id!,
      agentId: lead.assignedAgentId,
      projectId: lead.projectId,
      scheduledAt: daysAgo(between(5, 40)),
      status: "NO_SHOW" as const,
    });
  }
  await visitsCol.insertMany(visitDocs);

  /* ---------------------------------------------- bookings and journeys */

  const bookedLeads = allLeads.filter((l) => l.stage === "BOOKED");
  const available = allUnits.filter((u) => u.status === "AVAILABLE");
  let unitCursor = 0;
  let bookingSeq = 0;
  const customerIds: Array<{ id: ObjectId; unitId: ObjectId; projectId: ObjectId }> = [];

  for (const lead of bookedLeads) {
    const unit = available[unitCursor++];
    if (!unit) break;
    const bookingDate = lead.bookedAt ?? daysAgo(between(30, 330));

    const email = (lead.email ?? `${lead.phone}@buyer.gruhaflow.app`).toLowerCase();
    const customerRes = await users.insertOne({
      name: lead.name,
      email,
      phone: lead.phone,
      passwordHash: hashPassword("demo1234"),
      role: "CUSTOMER",
      active: true,
      createdAt: bookingDate,
    });

    bookingSeq += 1;
    const bookingRes = await bookingsCol.insertOne({
      leadId: lead._id!,
      customerId: customerRes.insertedId,
      unitId: unit._id!,
      projectId: unit.projectId,
      agentId: lead.assignedAgentId ?? pick(callerIds),
      bookingDate,
      totalAmount: unit.price,
      code: bookingCode(bookingSeq),
      status: "ACTIVE",
    });
    await unitsCol.updateOne({ _id: unit._id }, { $set: { status: "SOLD" } });

    // Walk the checklist forward by however long ago they booked, so some buyers
    // are at registration and a few have already done Gruha Pravesham. Each
    // booking also carries its own slippage, so real projects running late show
    // up as overdue milestones instead of everything landing exactly on plan.
    const ageDays = Math.round((Date.now() - bookingDate.getTime()) / 86400000);
    const slipDays = rand() < 0.45 ? between(10, 70) : 0;

    const steps = buildJourney(bookingRes.insertedId, bookingDate).map((step, i) => {
      const effectiveDue = STEP_DAYS[i] + slipDays;
      if (effectiveDue <= ageDays) {
        return {
          ...step,
          status: "DONE" as const,
          completedAt: addDays(bookingDate, effectiveDue),
        };
      }
      return step;
    });

    // Whatever is first still outstanding is what the team is working on now.
    const cursor = steps.findIndex((s) => s.status !== "DONE");
    if (cursor >= 0) {
      const overdue = steps[cursor].dueAt.getTime() < Date.now();
      steps[cursor] = {
        ...steps[cursor],
        status: overdue && rand() < 0.4 ? ("BLOCKED" as const) : ("IN_PROGRESS" as const),
        note: overdue
          ? pick([
              "Waiting on the buyer to submit the remaining documents.",
              "Held up at the sub-registrar office; new slot being booked.",
              "Vendor quotation under review by the project head.",
              "Dependent on the slab above being poured.",
            ])
          : undefined,
      };
    }
    await journeyCol.insertMany(steps);

    const payments = buildPayments(bookingRes.insertedId, bookingDate, unit.price).map((p) => {
      if (p.dueAt.getTime() < Date.now() - 5 * 86400000) {
        return rand() < 0.85
          ? { ...p, status: "PAID" as const, paidAt: p.dueAt }
          : { ...p, status: "OVERDUE" as const };
      }
      return p;
    });
    await paymentsCol.insertMany(payments);

    const allDone = steps.every((s) => s.status === "DONE");
    if (allDone) {
      await bookingsCol.updateOne(
        { _id: bookingRes.insertedId },
        { $set: { status: "HANDED_OVER" } }
      );
    }

    customerIds.push({ id: customerRes.insertedId, unitId: unit._id!, projectId: unit.projectId });
  }

  /* ----------------------------------------------------------- vendors */

  const vendorSeed: Array<[string, ServiceCategory]> = [
    ["Sree Electricals & Services", "ELECTRICITY"],
    ["AquaFix Plumbing Works", "PLUMBING"],
    ["DesignNest Interiors", "INTERIORS"],
    ["Sentinel Facility Security", "SECURITY"],
    ["BrightDay Housekeeping", "HOUSEKEEPING"],
    ["Teak & Co. Carpentry", "CARPENTRY"],
    ["ZeroPest Solutions", "PEST_CONTROL"],
    ["OtisCare Lift Maintenance", "LIFT"],
    ["JalDhara Water Systems", "WATER_SUPPLY"],
    ["FiberLink Broadband", "INTERNET"],
    ["ParkSmart Management", "PARKING"],
    ["GruhaFlow In-house Crew", "OTHER"],
  ];
  const vendorIds = new Map<ServiceCategory, ObjectId>();
  for (let i = 0; i < vendorSeed.length; i++) {
    const [name, category] = vendorSeed[i];
    const res = await vendorsCol.insertOne({
      name,
      category,
      phone: `90000${String(11000 + i * 777).slice(0, 5)}`,
      rating: Math.round((3.4 + rand() * 1.6) * 10) / 10,
      active: true,
    });
    vendorIds.set(category, res.insertedId);
  }

  /* ----------------------------------------------------------- tickets */

  const TICKET_TITLES: Record<string, string[]> = {
    ELECTRICITY: ["Bedroom power socket dead", "Common corridor lights off", "DG backup not switching over"],
    PLUMBING: ["Kitchen sink draining slowly", "Bathroom tap leaking", "Low water pressure on 8th floor"],
    INTERIORS: ["Wardrobe shutter alignment", "False ceiling hairline crack", "Modular kitchen drawer jammed"],
    SECURITY: ["Visitor gate pass not generated", "CCTV camera at B lobby offline", "Intercom not reaching flat"],
    HOUSEKEEPING: ["Staircase not cleaned since Monday", "Garbage not collected on 4th floor"],
    CARPENTRY: ["Main door hinge loose", "Balcony door not locking"],
    PEST_CONTROL: ["Cockroaches in utility area", "Termite marks near wardrobe"],
    LIFT: ["Lift B making noise between floors", "Lift door closing too fast"],
    WATER_SUPPLY: ["No water supply since morning", "Water tanker schedule unclear"],
    INTERNET: ["Fiber down since last night", "Cable TV channels missing"],
    PARKING: ["Someone parked in my allotted slot", "Basement ramp light not working"],
    OTHER: ["Request for move-in slot booking", "Need NOC for interior work"],
  };

  const statusMix: TicketStatus[] = [
    "OPEN", "OPEN", "OPEN", "ASSIGNED", "ASSIGNED", "IN_PROGRESS",
    "IN_PROGRESS", "ON_HOLD", "RESOLVED", "RESOLVED", "CLOSED", "CLOSED",
  ];

  let ticketSeq = 0;
  const ticketDocs = [];
  for (const customer of customerIds) {
    for (let t = 0; t < between(1, 4); t++) {
      const category = pick(SERVICE_CATEGORIES);
      const priority = pick(["EMERGENCY", "HIGH", "MEDIUM", "MEDIUM", "LOW", "LOW"] as const) as Priority;
      const status = pick(statusMix);
      const resolved = status === "RESOLVED" || status === "CLOSED";

      // SLAs run in hours, so a still-open ticket has to be recent or every
      // single one would read as breached. History goes further back.
      const hoursOld = resolved
        ? between(24, 24 * 60)
        : rand() < 0.25
          ? between(SLA_HOURS[priority] + 2, SLA_HOURS[priority] + 40) // genuinely late
          : between(0, Math.max(1, SLA_HOURS[priority] - 1)); // still inside the window
      const createdAt = new Date(Date.now() - hoursOld * 3600000);
      const slaDueAt = new Date(createdAt.getTime() + SLA_HOURS[priority] * 3600000);
      ticketSeq += 1;

      const timeline = [
        { at: createdAt, by: "Resident", text: "Ticket raised by resident." },
      ];
      if (status !== "OPEN") {
        timeline.push({
          at: new Date(createdAt.getTime() + 3600000),
          by: "Facility desk",
          text: `Assigned to ${vendorSeed.find(([, c]) => c === category)?.[0] ?? "in-house crew"}.`,
        });
      }
      if (resolved) {
        timeline.push({
          at: new Date(createdAt.getTime() + SLA_HOURS[priority] * 3600000 * 0.8),
          by: "Facility desk",
          text: "Work completed and verified with the resident.",
        });
      }

      ticketDocs.push({
        code: `GF-SR-${String(1000 + ticketSeq)}`,
        customerId: customer.id,
        unitId: customer.unitId,
        projectId: customer.projectId,
        category,
        priority,
        title: pick(TICKET_TITLES[category] ?? [`${CATEGORY_LABELS[category]} issue`]),
        description: `Reported from the resident portal. Category: ${CATEGORY_LABELS[category]}. Please inspect and update the ticket with findings.`,
        status,
        vendorId: status === "OPEN" ? undefined : vendorIds.get(category),
        slaDueAt,
        createdAt,
        resolvedAt: resolved
          ? new Date(createdAt.getTime() + SLA_HOURS[priority] * 3600000 * 0.8)
          : undefined,
        timeline,
      });
    }
  }
  if (ticketDocs.length) await ticketsCol.insertMany(ticketDocs);

  /* ---------------------------------------------------------- invoices */

  const invoiceDocs = [];
  for (const customer of customerIds) {
    for (let m = 0; m < 4; m++) {
      const d = new Date();
      d.setMonth(d.getMonth() - m, 5);
      const lines = [
        { label: "Common area maintenance", amount: 2800 },
        { label: "Water charges", amount: 650 },
        { label: "Security & housekeeping", amount: 1450 },
        { label: "Lift & DG upkeep", amount: 520 },
        { label: "Corpus contribution", amount: 400 },
      ];
      const amount = lines.reduce((s, l) => s + l.amount, 0);
      const isPast = d.getTime() < Date.now();
      const paid = isPast && rand() < 0.78;
      invoiceDocs.push({
        customerId: customer.id,
        unitId: customer.unitId,
        period: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
        lines,
        amount,
        dueAt: d,
        paidAt: paid ? new Date(d.getTime() + 86400000 * between(1, 8)) : undefined,
        status: paid ? ("PAID" as const) : isPast ? ("OVERDUE" as const) : ("DUE" as const),
      });
    }
  }
  if (invoiceDocs.length) await invoicesCol.insertMany(invoiceDocs);

  return {
    users: await users.countDocuments({}),
    projects: projectIds.length,
    units: unitDocs.length,
    leads: leadDocs.length,
    calls: callDocs.length,
    visits: visitDocs.length,
    bookings: bookingSeq,
    journeySteps: await journeyCol.countDocuments({}),
    payments: await paymentsCol.countDocuments({}),
    vendors: vendorSeed.length,
    tickets: ticketDocs.length,
    invoices: invoiceDocs.length,
  };
}

