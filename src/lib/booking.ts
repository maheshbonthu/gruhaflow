import { ObjectId } from "mongodb";
import { collections } from "./mongodb";
import { hashPassword } from "./auth";
import { JOURNEY_STEPS, type JourneyStepDoc, type PaymentDoc } from "./types";

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

export function bookingCode(seq: number): string {
  return `GF-BK-${String(seq).padStart(5, "0")}`;
}

/** The standard construction-linked payment plan applied to every booking. */
const PAYMENT_PLAN: Array<{ label: string; share: number; days: number }> = [
  { label: "Token advance", share: 0.1, days: 0 },
  { label: "On agreement", share: 0.15, days: 21 },
  { label: "On foundation", share: 0.15, days: 90 },
  { label: "On 5th slab", share: 0.2, days: 180 },
  { label: "On brickwork & plastering", share: 0.15, days: 260 },
  { label: "On flooring & fittings", share: 0.15, days: 320 },
  { label: "On handover", share: 0.1, days: 360 },
];

export function buildJourney(bookingId: ObjectId, bookingDate: Date): JourneyStepDoc[] {
  return JOURNEY_STEPS.map((step, i) => ({
    bookingId,
    key: step.key,
    title: step.title,
    owner: step.owner,
    order: i,
    status: i === 0 ? ("DONE" as const) : ("PENDING" as const),
    dueAt: addDays(bookingDate, step.days),
    completedAt: i === 0 ? bookingDate : undefined,
  }));
}

export function buildPayments(
  bookingId: ObjectId,
  bookingDate: Date,
  totalAmount: number
): PaymentDoc[] {
  return PAYMENT_PLAN.map((p, i) => ({
    bookingId,
    label: p.label,
    amount: Math.round(totalAmount * p.share),
    dueAt: addDays(bookingDate, p.days),
    paidAt: i === 0 ? bookingDate : undefined,
    status: i === 0 ? ("PAID" as const) : ("DUE" as const),
  }));
}

export interface ConvertResult {
  bookingId: string;
  code: string;
  customerId: string;
  /** Set when a brand new portal login was created for this buyer. */
  tempPassword?: string;
}

/**
 * Turns a lead into a buyer: marks the lead BOOKED, reserves the unit, creates
 * (or reuses) a customer login, then lays down the full handover checklist and
 * payment schedule so the portal has something to show from minute one.
 */
export async function convertLeadToBooking(opts: {
  leadId: string;
  unitId: string;
  agentId: string;
  totalAmount?: number;
  bookingDate?: Date;
}): Promise<ConvertResult> {
  const leads = await collections.leads();
  const units = await collections.units();
  const users = await collections.users();
  const bookings = await collections.bookings();
  const journey = await collections.journey();
  const payments = await collections.payments();

  const lead = await leads.findOne({ _id: new ObjectId(opts.leadId) });
  if (!lead) throw new Error("Lead not found");

  // Idempotency first: a retried conversion returns the booking that exists
  // rather than complaining that the unit it already allotted is now sold.
  const existing = await bookings.findOne({ leadId: lead._id });
  if (existing) {
    return {
      bookingId: String(existing._id),
      code: existing.code,
      customerId: String(existing.customerId),
    };
  }

  const unit = await units.findOne({ _id: new ObjectId(opts.unitId) });
  if (!unit) throw new Error("Unit not found");
  if (unit.status === "SOLD") throw new Error(`Unit ${unit.unitNo} is already sold`);

  const bookingDate = opts.bookingDate ?? new Date();
  const totalAmount = opts.totalAmount ?? unit.price;

  // Reuse the login if this buyer already exists, otherwise mint one.
  const email = (lead.email ?? `${lead.phone}@buyer.gruhaflow.app`).toLowerCase();
  let customer = await users.findOne({ email });
  let tempPassword: string | undefined;
  if (!customer) {
    tempPassword = `Home@${lead.phone.slice(-4)}`;
    const inserted = await users.insertOne({
      name: lead.name,
      email,
      phone: lead.phone,
      passwordHash: hashPassword(tempPassword),
      role: "CUSTOMER",
      active: true,
      createdAt: new Date(),
    });
    customer = await users.findOne({ _id: inserted.insertedId });
  }
  if (!customer?._id) throw new Error("Could not create the customer login");

  const seq = (await bookings.countDocuments({})) + 1;
  const code = bookingCode(seq);

  const result = await bookings.insertOne({
    leadId: lead._id!,
    customerId: customer._id,
    unitId: unit._id!,
    projectId: unit.projectId,
    agentId: new ObjectId(opts.agentId),
    bookingDate,
    totalAmount,
    code,
    status: "ACTIVE",
  });

  await Promise.all([
    units.updateOne({ _id: unit._id }, { $set: { status: "SOLD" } }),
    leads.updateOne(
      { _id: lead._id },
      { $set: { stage: "BOOKED", bookedAt: bookingDate, updatedAt: new Date() } }
    ),
    journey.insertMany(buildJourney(result.insertedId, bookingDate)),
    payments.insertMany(buildPayments(result.insertedId, bookingDate, totalAmount)),
  ]);

  return {
    bookingId: String(result.insertedId),
    code,
    customerId: String(customer._id),
    tempPassword,
  };
}

/** Share of handover steps completed, used for the progress bars everywhere. */
export function journeyProgress(steps: Pick<JourneyStepDoc, "status">[]): number {
  if (!steps.length) return 0;
  const done = steps.filter((s) => s.status === "DONE").length;
  return Math.round((done / steps.length) * 100);
}
