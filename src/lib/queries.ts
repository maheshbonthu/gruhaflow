import { ObjectId, type Filter } from "mongodb";
import { collections } from "./mongodb";
import { journeyProgress } from "./booking";
import type {
  AnyStage,
  CallDoc,
  InvoiceDoc,
  JourneyStepDoc,
  LeadDoc,
  PaymentDoc,
  Priority,
  ServiceCategory,
  TicketDoc,
  TicketStatus,
  UnitDoc,
} from "./types";

/** Everything the UI needs about a lead row, with names resolved. */
export interface LeadRow {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  stage: AnyStage;
  agentName: string;
  projectName: string;
  budget: string;
  callCount: number;
  lastCallAt?: Date;
  createdAt: Date;
}

export interface LeadQuery {
  stage?: string;
  agentId?: string;
  projectId?: string;
  q?: string;
  page?: number;
  perPage?: number;
}

function budgetLabel(lead: LeadDoc): string {
  if (!lead.budgetMin && !lead.budgetMax) return "—";
  const l = (n?: number) => (n ? `${(n / 100000).toFixed(0)}L` : "?");
  return `${l(lead.budgetMin)} – ${l(lead.budgetMax)}`;
}

export async function listLeads(query: LeadQuery = {}): Promise<{
  rows: LeadRow[];
  total: number;
  page: number;
  perPage: number;
}> {
  const leads = await collections.leads();
  const users = await collections.users();
  const projects = await collections.projects();

  const filter: Filter<LeadDoc> = {};
  if (query.stage && query.stage !== "ALL") filter.stage = query.stage as AnyStage;
  if (query.agentId && ObjectId.isValid(query.agentId)) {
    filter.assignedAgentId = new ObjectId(query.agentId);
  }
  if (query.projectId && ObjectId.isValid(query.projectId)) {
    filter.projectId = new ObjectId(query.projectId);
  }
  if (query.q?.trim()) {
    const rx = new RegExp(query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { phone: rx }, { email: rx }];
  }

  const perPage = Math.min(query.perPage ?? 50, 200);
  const page = Math.max(1, query.page ?? 1);

  const [docs, total, staff, projectDocs] = await Promise.all([
    leads
      .find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .toArray(),
    leads.countDocuments(filter),
    users.find({ role: { $in: ["AGENT", "MANAGER", "ADMIN"] } }).toArray(),
    projects.find({}).toArray(),
  ]);

  const staffMap = new Map(staff.map((s) => [String(s._id), s.name]));
  const projectMap = new Map(projectDocs.map((p) => [String(p._id), p.name]));

  return {
    rows: docs.map((lead) => ({
      id: String(lead._id),
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      stage: lead.stage,
      agentName: lead.assignedAgentId
        ? (staffMap.get(String(lead.assignedAgentId)) ?? "—")
        : "Unassigned",
      projectName: lead.projectId ? (projectMap.get(String(lead.projectId)) ?? "—") : "—",
      budget: budgetLabel(lead),
      callCount: lead.callCount,
      lastCallAt: lead.lastCallAt,
      createdAt: lead.createdAt,
    })),
    total,
    page,
    perPage,
  };
}

export interface LeadDetail {
  lead: LeadDoc & { _id: ObjectId };
  agentName: string;
  projectName: string;
  calls: Array<CallDoc & { agentName: string }>;
  visits: Array<{
    id: string;
    scheduledAt: Date;
    visitedAt?: Date;
    status: string;
    feedback?: string;
    rating?: number;
  }>;
  booking?: { id: string; code: string; totalAmount: number; unitNo: string };
  availableUnits: Array<{ id: string; label: string; price: number }>;
}

export async function getLeadDetail(id: string): Promise<LeadDetail | null> {
  if (!ObjectId.isValid(id)) return null;
  const leads = await collections.leads();
  const lead = await leads.findOne({ _id: new ObjectId(id) });
  if (!lead) return null;

  const users = await collections.users();
  const projects = await collections.projects();
  const callsCol = await collections.calls();
  const visitsCol = await collections.visits();
  const bookingsCol = await collections.bookings();
  const unitsCol = await collections.units();

  const [calls, visits, booking, staff, project] = await Promise.all([
    callsCol.find({ leadId: lead._id }).sort({ createdAt: -1 }).toArray(),
    visitsCol.find({ leadId: lead._id }).sort({ scheduledAt: -1 }).toArray(),
    bookingsCol.findOne({ leadId: lead._id }),
    users.find({ role: { $in: ["AGENT", "MANAGER", "ADMIN"] } }).toArray(),
    lead.projectId ? projects.findOne({ _id: lead.projectId }) : null,
  ]);

  const staffMap = new Map(staff.map((s) => [String(s._id), s.name]));

  // Offer units in the lead's own project first; fall back to anything free.
  const unitFilter: Filter<UnitDoc> = { status: "AVAILABLE" };
  if (lead.projectId) unitFilter.projectId = lead.projectId;
  let units = await unitsCol.find(unitFilter).limit(40).toArray();
  if (!units.length) {
    units = await unitsCol.find({ status: "AVAILABLE" }).limit(40).toArray();
  }

  let bookingInfo: LeadDetail["booking"];
  if (booking) {
    const unit = await unitsCol.findOne({ _id: booking.unitId });
    bookingInfo = {
      id: String(booking._id),
      code: booking.code,
      totalAmount: booking.totalAmount,
      unitNo: unit?.unitNo ?? "—",
    };
  }

  return {
    lead: lead as LeadDoc & { _id: ObjectId },
    agentName: lead.assignedAgentId
      ? (staffMap.get(String(lead.assignedAgentId)) ?? "—")
      : "Unassigned",
    projectName: project?.name ?? "—",
    calls: calls.map((c) => ({ ...c, agentName: staffMap.get(String(c.agentId)) ?? "—" })),
    visits: visits.map((v) => ({
      id: String(v._id),
      scheduledAt: v.scheduledAt,
      visitedAt: v.visitedAt,
      status: v.status,
      feedback: v.feedback,
      rating: v.rating,
    })),
    booking: bookingInfo,
    availableUnits: units.map((u) => ({
      id: String(u._id),
      label: `${u.unitNo} · ${u.bhk} BHK · ${u.sqft} sqft · ${u.facing}`,
      price: u.price,
    })),
  };
}

/* ------------------------------------------------------------- post-sales */

export interface BookingRow {
  id: string;
  code: string;
  customerName: string;
  customerEmail: string;
  projectName: string;
  unitNo: string;
  bhk: number;
  totalAmount: number;
  bookingDate: Date;
  status: string;
  agentName: string;
  progress: number;
  nextStep?: string;
  overdueSteps: number;
  paidAmount: number;
}

export async function listBookings(): Promise<BookingRow[]> {
  const bookingsCol = await collections.bookings();
  const users = await collections.users();
  const units = await collections.units();
  const projects = await collections.projects();
  const journey = await collections.journey();
  const payments = await collections.payments();

  const bookings = await bookingsCol.find({}).sort({ bookingDate: -1 }).toArray();
  if (!bookings.length) return [];

  const ids = bookings.map((b) => b._id!);
  const [userDocs, unitDocs, projectDocs, steps, paymentDocs] = await Promise.all([
    users.find({}).toArray(),
    units.find({ _id: { $in: bookings.map((b) => b.unitId) } }).toArray(),
    projects.find({}).toArray(),
    journey.find({ bookingId: { $in: ids } }).sort({ order: 1 }).toArray(),
    payments.find({ bookingId: { $in: ids } }).toArray(),
  ]);

  const userMap = new Map(userDocs.map((u) => [String(u._id), u]));
  const unitMap = new Map(unitDocs.map((u) => [String(u._id), u]));
  const projectMap = new Map(projectDocs.map((p) => [String(p._id), p.name]));

  const stepsByBooking = new Map<string, JourneyStepDoc[]>();
  for (const s of steps) {
    const key = String(s.bookingId);
    if (!stepsByBooking.has(key)) stepsByBooking.set(key, []);
    stepsByBooking.get(key)!.push(s);
  }

  const paidByBooking = new Map<string, number>();
  for (const p of paymentDocs) {
    if (p.status !== "PAID") continue;
    const key = String(p.bookingId);
    paidByBooking.set(key, (paidByBooking.get(key) ?? 0) + p.amount);
  }

  const now = Date.now();
  return bookings.map((b) => {
    const key = String(b._id);
    const mySteps = stepsByBooking.get(key) ?? [];
    const customer = userMap.get(String(b.customerId));
    const unit = unitMap.get(String(b.unitId));
    return {
      id: key,
      code: b.code,
      customerName: customer?.name ?? "—",
      customerEmail: customer?.email ?? "—",
      projectName: projectMap.get(String(b.projectId)) ?? "—",
      unitNo: unit?.unitNo ?? "—",
      bhk: unit?.bhk ?? 0,
      totalAmount: b.totalAmount,
      bookingDate: b.bookingDate,
      status: b.status,
      agentName: userMap.get(String(b.agentId))?.name ?? "—",
      progress: journeyProgress(mySteps),
      nextStep: mySteps.find((s) => s.status !== "DONE")?.title,
      overdueSteps: mySteps.filter((s) => s.status !== "DONE" && s.dueAt.getTime() < now).length,
      paidAmount: paidByBooking.get(key) ?? 0,
    };
  });
}

export interface TicketRow {
  id: string;
  code: string;
  customerName: string;
  unitNo: string;
  projectName: string;
  category: ServiceCategory;
  priority: Priority;
  title: string;
  status: TicketStatus;
  vendorName?: string;
  slaDueAt: Date;
  createdAt: Date;
  breached: boolean;
}

export async function listTickets(filter: {
  status?: string;
  category?: string;
  priority?: string;
  customerId?: string;
} = {}): Promise<TicketRow[]> {
  const ticketsCol = await collections.tickets();
  const users = await collections.users();
  const units = await collections.units();
  const projects = await collections.projects();
  const vendors = await collections.vendors();

  const q: Filter<TicketDoc> = {};
  if (filter.status === "OPEN_ONLY") q.status = { $nin: ["RESOLVED", "CLOSED"] };
  else if (filter.status && filter.status !== "ALL") q.status = filter.status as TicketStatus;
  if (filter.category && filter.category !== "ALL") q.category = filter.category as ServiceCategory;
  if (filter.priority && filter.priority !== "ALL") q.priority = filter.priority as Priority;
  if (filter.customerId && ObjectId.isValid(filter.customerId)) {
    q.customerId = new ObjectId(filter.customerId);
  }

  const tickets = await ticketsCol.find(q).sort({ createdAt: -1 }).limit(300).toArray();
  if (!tickets.length) return [];

  const [userDocs, unitDocs, projectDocs, vendorDocs] = await Promise.all([
    users.find({ _id: { $in: tickets.map((t) => t.customerId) } }).toArray(),
    units.find({}).toArray(),
    projects.find({}).toArray(),
    vendors.find({}).toArray(),
  ]);

  const userMap = new Map(userDocs.map((u) => [String(u._id), u.name]));
  const unitMap = new Map(unitDocs.map((u) => [String(u._id), u.unitNo]));
  const projectMap = new Map(projectDocs.map((p) => [String(p._id), p.name]));
  const vendorMap = new Map(vendorDocs.map((v) => [String(v._id), v.name]));

  const now = Date.now();
  return tickets.map((t) => ({
    id: String(t._id),
    code: t.code,
    customerName: userMap.get(String(t.customerId)) ?? "—",
    unitNo: t.unitId ? (unitMap.get(String(t.unitId)) ?? "—") : "—",
    projectName: t.projectId ? (projectMap.get(String(t.projectId)) ?? "—") : "—",
    category: t.category,
    priority: t.priority,
    title: t.title,
    status: t.status,
    vendorName: t.vendorId ? vendorMap.get(String(t.vendorId)) : undefined,
    slaDueAt: t.slaDueAt,
    createdAt: t.createdAt,
    breached:
      !["RESOLVED", "CLOSED"].includes(t.status) && t.slaDueAt.getTime() < now,
  }));
}

/** The buyer's own view: their booking, checklist, payments, tickets and bills. */
export interface CustomerView {
  booking?: {
    id: string;
    code: string;
    projectName: string;
    locality: string;
    city: string;
    possession: string;
    amenities: string[];
    unitNo: string;
    tower: string;
    floor: number;
    bhk: number;
    sqft: number;
    facing: string;
    totalAmount: number;
    bookingDate: Date;
    status: string;
    agentName: string;
    agentPhone: string;
  };
  steps: JourneyStepDoc[];
  progress: number;
  payments: PaymentDoc[];
  paid: number;
  tickets: TicketRow[];
  invoices: InvoiceDoc[];
}

export async function getCustomerView(customerId: string): Promise<CustomerView> {
  const empty: CustomerView = {
    steps: [],
    progress: 0,
    payments: [],
    paid: 0,
    tickets: [],
    invoices: [],
  };
  if (!ObjectId.isValid(customerId)) return empty;

  const bookingsCol = await collections.bookings();
  const booking = await bookingsCol.findOne({ customerId: new ObjectId(customerId) });

  const ticketsPromise = listTickets({ customerId, status: "ALL" });
  const invoicesCol = await collections.invoices();
  const invoicesPromise = invoicesCol
    .find({ customerId: new ObjectId(customerId) })
    .sort({ dueAt: -1 })
    .toArray();

  if (!booking) {
    const [tickets, invoices] = await Promise.all([ticketsPromise, invoicesPromise]);
    return { ...empty, tickets, invoices };
  }

  const units = await collections.units();
  const projects = await collections.projects();
  const users = await collections.users();
  const journey = await collections.journey();
  const paymentsCol = await collections.payments();

  const [unit, project, agent, steps, payments, tickets, invoices] = await Promise.all([
    units.findOne({ _id: booking.unitId }),
    projects.findOne({ _id: booking.projectId }),
    users.findOne({ _id: booking.agentId }),
    journey.find({ bookingId: booking._id }).sort({ order: 1 }).toArray(),
    paymentsCol.find({ bookingId: booking._id }).sort({ dueAt: 1 }).toArray(),
    ticketsPromise,
    invoicesPromise,
  ]);

  return {
    booking: {
      id: String(booking._id),
      code: booking.code,
      projectName: project?.name ?? "—",
      locality: project?.locality ?? "—",
      city: project?.city ?? "—",
      possession: project?.possession ?? "—",
      amenities: project?.amenities ?? [],
      unitNo: unit?.unitNo ?? "—",
      tower: unit?.tower ?? "—",
      floor: unit?.floor ?? 0,
      bhk: unit?.bhk ?? 0,
      sqft: unit?.sqft ?? 0,
      facing: unit?.facing ?? "—",
      totalAmount: booking.totalAmount,
      bookingDate: booking.bookingDate,
      status: booking.status,
      agentName: agent?.name ?? "—",
      agentPhone: agent?.phone ?? "—",
    },
    steps,
    progress: journeyProgress(steps),
    payments,
    paid: payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0),
    tickets,
    invoices,
  };
}
