import { MongoClient, type Db } from "mongodb";
import type {
  BookingDoc,
  CallDoc,
  InvoiceDoc,
  JourneyStepDoc,
  LeadDoc,
  PaymentDoc,
  ProjectDoc,
  TicketDoc,
  UnitDoc,
  UserDoc,
  VendorDoc,
  VisitDoc,
} from "./types";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "gruhaflow";

/**
 * Serverless functions are recycled constantly, so the client is cached on the
 * global object. Without this every request would open a fresh connection pool
 * and Atlas would start refusing them.
 */
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

export function getClient(): Promise<MongoClient> {
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env.local and point it at your Atlas cluster."
    );
  }
  if (!globalForMongo._mongoClientPromise) {
    globalForMongo._mongoClientPromise = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    }).connect();
  }
  return globalForMongo._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(dbName);
}

/** True when the app has a database configured and reachable. */
export async function isDbReady(): Promise<boolean> {
  if (!uri) return false;
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

export const collections = {
  users: async () => (await getDb()).collection<UserDoc>("users"),
  projects: async () => (await getDb()).collection<ProjectDoc>("projects"),
  units: async () => (await getDb()).collection<UnitDoc>("units"),
  leads: async () => (await getDb()).collection<LeadDoc>("leads"),
  calls: async () => (await getDb()).collection<CallDoc>("calls"),
  visits: async () => (await getDb()).collection<VisitDoc>("visits"),
  bookings: async () => (await getDb()).collection<BookingDoc>("bookings"),
  journey: async () => (await getDb()).collection<JourneyStepDoc>("journeySteps"),
  payments: async () => (await getDb()).collection<PaymentDoc>("payments"),
  vendors: async () => (await getDb()).collection<VendorDoc>("vendors"),
  tickets: async () => (await getDb()).collection<TicketDoc>("tickets"),
  invoices: async () => (await getDb()).collection<InvoiceDoc>("invoices"),
};

export async function ensureIndexes(): Promise<void> {
  const db = await getDb();
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("leads").createIndex({ stage: 1 }),
    db.collection("leads").createIndex({ assignedAgentId: 1, stage: 1 }),
    db.collection("leads").createIndex({ phone: 1 }),
    db.collection("calls").createIndex({ leadId: 1, createdAt: -1 }),
    db.collection("calls").createIndex({ agentId: 1, createdAt: -1 }),
    db.collection("visits").createIndex({ leadId: 1 }),
    db.collection("bookings").createIndex({ customerId: 1 }),
    db.collection("journeySteps").createIndex({ bookingId: 1, order: 1 }),
    db.collection("payments").createIndex({ bookingId: 1, dueAt: 1 }),
    db.collection("tickets").createIndex({ customerId: 1, createdAt: -1 }),
    db.collection("tickets").createIndex({ status: 1, priority: 1 }),
    db.collection("invoices").createIndex({ customerId: 1, dueAt: -1 }),
  ]);
}
