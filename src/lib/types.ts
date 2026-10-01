import type { ObjectId } from "mongodb";

/* ------------------------------------------------------------------ roles */

export const ROLES = ["ADMIN", "MANAGER", "AGENT", "CUSTOMER"] as const;
export type Role = (typeof ROLES)[number];

/* ----------------------------------------------------- tele-calling funnel */

/**
 * The single ordered pipeline a lead walks down. The four numbers the business
 * actually asks for map onto these stages:
 *   "how many called"     -> stage at or past CALLED
 *   "how many interested" -> stage at or past INTERESTED
 *   "how many visited"    -> stage at or past SITE_VISITED
 *   "how many bought"     -> stage is BOOKED
 */
export const LEAD_STAGES = [
  "NEW",
  "CALLED",
  "INTERESTED",
  "SITE_VISIT_SCHEDULED",
  "SITE_VISITED",
  "NEGOTIATION",
  "BOOKED",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

/** Terminal stages that sit outside the forward funnel. */
export const DEAD_STAGES = ["NOT_INTERESTED", "UNREACHABLE", "LOST"] as const;
export type DeadStage = (typeof DEAD_STAGES)[number];

export type AnyStage = LeadStage | DeadStage;

export const STAGE_LABELS: Record<AnyStage, string> = {
  NEW: "New lead",
  CALLED: "Called",
  INTERESTED: "Interested",
  SITE_VISIT_SCHEDULED: "Visit scheduled",
  SITE_VISITED: "Visited site",
  NEGOTIATION: "In negotiation",
  BOOKED: "Booked / bought",
  NOT_INTERESTED: "Not interested",
  UNREACHABLE: "Unreachable",
  LOST: "Lost",
};

export function stageIndex(stage: AnyStage): number {
  return (LEAD_STAGES as readonly string[]).indexOf(stage);
}

export function isDead(stage: AnyStage): stage is DeadStage {
  return (DEAD_STAGES as readonly string[]).includes(stage);
}

/** True when a lead has reached `target` or anything past it. */
export function hasReached(stage: AnyStage, target: LeadStage): boolean {
  const i = stageIndex(stage);
  return i >= 0 && i >= stageIndex(target);
}

export const LEAD_SOURCES = [
  "WEBSITE",
  "PORTAL_99ACRES",
  "PORTAL_MAGICBRICKS",
  "WALK_IN",
  "REFERRAL",
  "FACEBOOK",
  "GOOGLE_ADS",
  "COLD_LIST",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

/* ------------------------------------------------------------------- calls */

export const CALL_OUTCOMES = [
  "CONNECTED",
  "NO_ANSWER",
  "BUSY",
  "SWITCHED_OFF",
  "WRONG_NUMBER",
] as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];

export const CALL_DISPOSITIONS = [
  "INTERESTED",
  "NOT_INTERESTED",
  "CALLBACK_LATER",
  "SITE_VISIT_BOOKED",
  "BUDGET_MISMATCH",
  "ALREADY_BOUGHT",
  "NO_DISPOSITION",
] as const;
export type CallDisposition = (typeof CALL_DISPOSITIONS)[number];

/* -------------------------------------------- post-booking handover journey */

/**
 * Everything between "they paid the token" and Gruha Pravesham. Every booking
 * gets one copy of this checklist, in this order.
 */
export const JOURNEY_STEPS = [
  { key: "BOOKING_CONFIRMED", title: "Booking confirmed", owner: "Sales", days: 0 },
  { key: "TOKEN_RECEIPT", title: "Token advance receipt issued", owner: "Accounts", days: 2 },
  { key: "KYC_DOCS", title: "KYC documents collected", owner: "CRM", days: 7 },
  { key: "AGREEMENT_SIGNED", title: "Sale agreement signed", owner: "Legal", days: 21 },
  { key: "LOAN_SANCTIONED", title: "Home loan sanctioned", owner: "Loan desk", days: 45 },
  { key: "REGISTRATION", title: "Registration and stamp duty", owner: "Legal", days: 75 },
  { key: "CONSTRUCTION_SLAB", title: "Slab-wise construction updates", owner: "Projects", days: 180 },
  { key: "ELECTRICAL_SANCTION", title: "Electricity connection sanctioned", owner: "Facilities", days: 240 },
  { key: "WATER_SANCTION", title: "Water and sewerage connection", owner: "Facilities", days: 250 },
  { key: "INTERIOR_DESIGN", title: "Interior design sign-off", owner: "Interiors", days: 270 },
  { key: "INTERIOR_EXECUTION", title: "Interior execution complete", owner: "Interiors", days: 320 },
  { key: "SNAG_LIST", title: "Snag list raised and closed", owner: "Quality", days: 340 },
  { key: "FINAL_PAYMENT", title: "Final payment cleared", owner: "Accounts", days: 350 },
  { key: "OC_RECEIVED", title: "Occupancy certificate received", owner: "Legal", days: 355 },
  { key: "KEY_HANDOVER", title: "Key handover", owner: "CRM", days: 360 },
  { key: "GRUHA_PRAVESHAM", title: "Gruha Pravesham", owner: "CRM", days: 370 },
] as const;

export type JourneyStepKey = (typeof JOURNEY_STEPS)[number]["key"];

export const STEP_STATUSES = ["PENDING", "IN_PROGRESS", "BLOCKED", "DONE"] as const;
export type StepStatus = (typeof STEP_STATUSES)[number];

/* ------------------------------------------------- maintenance and services */

export const SERVICE_CATEGORIES = [
  "ELECTRICITY",
  "PLUMBING",
  "INTERIORS",
  "SECURITY",
  "HOUSEKEEPING",
  "CARPENTRY",
  "PEST_CONTROL",
  "LIFT",
  "WATER_SUPPLY",
  "INTERNET",
  "PARKING",
  "OTHER",
] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  ELECTRICITY: "Electricity",
  PLUMBING: "Plumbing",
  INTERIORS: "Interiors",
  SECURITY: "Security",
  HOUSEKEEPING: "Housekeeping",
  CARPENTRY: "Carpentry",
  PEST_CONTROL: "Pest control",
  LIFT: "Lift / elevator",
  WATER_SUPPLY: "Water supply",
  INTERNET: "Internet and cable",
  PARKING: "Parking",
  OTHER: "Other",
};

/** Hours allowed before a ticket of each priority breaches its SLA. */
export const SLA_HOURS = { EMERGENCY: 2, HIGH: 8, MEDIUM: 24, LOW: 72 } as const;
export const PRIORITIES = ["EMERGENCY", "HIGH", "MEDIUM", "LOW"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const TICKET_STATUSES = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "RESOLVED",
  "CLOSED",
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

/* ---------------------------------------------------------------- entities */

export interface UserDoc {
  _id?: ObjectId;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: Role;
  active: boolean;
  createdAt: Date;
}

export const PROPERTY_TYPES = ["APARTMENT", "VILLA", "PLOT", "PENTHOUSE"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const CONSTRUCTION_STATUS = ["UNDER_CONSTRUCTION", "READY_TO_MOVE", "NEW_LAUNCH"] as const;
export type ConstructionStatus = (typeof CONSTRUCTION_STATUS)[number];

export interface ProjectDoc {
  _id?: ObjectId;
  name: string;
  city: string;
  locality: string;
  totalUnits: number;
  priceFrom: number;
  priceTo: number;
  possession: string;
  amenities: string[];
  rera: string;

  /* Fields the public listing pages need. */
  slug: string;
  builder: string;
  tagline: string;
  about: string;
  propertyType: PropertyType;
  status: ConstructionStatus;
  address: string;
  configs: string[];
  sqftFrom: number;
  sqftTo: number;
  pricePerSqft: number;
  rating: number;
  highlights: string[];
  featured: boolean;
}

export interface UnitDoc {
  _id?: ObjectId;
  projectId: ObjectId;
  tower: string;
  unitNo: string;
  floor: number;
  bhk: number;
  sqft: number;
  price: number;
  facing: string;
  status: "AVAILABLE" | "HELD" | "SOLD";
}

export interface LeadDoc {
  _id?: ObjectId;
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  projectId?: ObjectId;
  assignedAgentId?: ObjectId;
  stage: AnyStage;
  budgetMin?: number;
  budgetMax?: number;
  notes?: string;
  callCount: number;
  lastCallAt?: Date;
  interestedAt?: Date;
  visitedAt?: Date;
  bookedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CallDoc {
  _id?: ObjectId;
  leadId: ObjectId;
  agentId: ObjectId;
  outcome: CallOutcome;
  disposition: CallDisposition;
  durationSec: number;
  notes?: string;
  nextFollowUpAt?: Date;
  createdAt: Date;
}

export interface VisitDoc {
  _id?: ObjectId;
  leadId: ObjectId;
  agentId: ObjectId;
  projectId?: ObjectId;
  scheduledAt: Date;
  visitedAt?: Date;
  status: "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";
  feedback?: string;
  rating?: number;
}

export interface BookingDoc {
  _id?: ObjectId;
  leadId: ObjectId;
  customerId: ObjectId;
  unitId: ObjectId;
  projectId: ObjectId;
  agentId: ObjectId;
  bookingDate: Date;
  totalAmount: number;
  code: string;
  status: "ACTIVE" | "HANDED_OVER" | "CANCELLED";
}

export interface JourneyStepDoc {
  _id?: ObjectId;
  bookingId: ObjectId;
  key: JourneyStepKey;
  title: string;
  owner: string;
  order: number;
  status: StepStatus;
  dueAt: Date;
  completedAt?: Date;
  note?: string;
}

export interface PaymentDoc {
  _id?: ObjectId;
  bookingId: ObjectId;
  label: string;
  amount: number;
  dueAt: Date;
  paidAt?: Date;
  status: "DUE" | "PAID" | "OVERDUE";
}

export interface VendorDoc {
  _id?: ObjectId;
  name: string;
  category: ServiceCategory;
  phone: string;
  rating: number;
  active: boolean;
}

export interface TicketEvent {
  at: Date;
  by: string;
  text: string;
}

export interface TicketDoc {
  _id?: ObjectId;
  code: string;
  customerId: ObjectId;
  unitId?: ObjectId;
  projectId?: ObjectId;
  category: ServiceCategory;
  priority: Priority;
  title: string;
  description: string;
  status: TicketStatus;
  vendorId?: ObjectId;
  slaDueAt: Date;
  createdAt: Date;
  resolvedAt?: Date;
  timeline: TicketEvent[];
}

export interface InvoiceDoc {
  _id?: ObjectId;
  customerId: ObjectId;
  unitId: ObjectId;
  period: string;
  lines: { label: string; amount: number }[];
  amount: number;
  dueAt: Date;
  paidAt?: Date;
  status: "DUE" | "PAID" | "OVERDUE";
}
