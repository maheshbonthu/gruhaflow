import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { collections } from "@/lib/mongodb";
import { fail, ok } from "@/lib/api";
import { PRIORITIES, SERVICE_CATEGORIES, SLA_HOURS } from "@/lib/types";

const Body = z.object({
  category: z.enum(SERVICE_CATEGORIES),
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  title: z.string().min(4).max(140),
  description: z.string().min(5).max(2000),
  /** Staff raising a ticket on a resident's behalf must name the customer. */
  customerId: z.string().optional(),
});

/**
 * Residents raise their own tickets; staff may raise one on a resident's behalf.
 * The SLA clock is set from the priority at creation time so the breach report
 * never depends on when someone happens to look at it.
 */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = Body.parse(await req.json());

    const tickets = await collections.tickets();
    const bookings = await collections.bookings();

    const customerId =
      session.role === "CUSTOMER"
        ? session.uid
        : body.customerId && ObjectId.isValid(body.customerId)
          ? body.customerId
          : null;
    if (!customerId) {
      return ok({ error: "Pick which resident this ticket belongs to." }, 422);
    }

    // Tie the ticket to the flat so the facility team knows where to go.
    const booking = await bookings.findOne({ customerId: new ObjectId(customerId) });

    const now = new Date();
    const seq = (await tickets.countDocuments({})) + 1;
    const res = await tickets.insertOne({
      code: `GF-SR-${String(1000 + seq)}`,
      customerId: new ObjectId(customerId),
      unitId: booking?.unitId,
      projectId: booking?.projectId,
      category: body.category,
      priority: body.priority,
      title: body.title.trim(),
      description: body.description.trim(),
      status: "OPEN",
      slaDueAt: new Date(now.getTime() + SLA_HOURS[body.priority] * 3600000),
      createdAt: now,
      timeline: [
        {
          at: now,
          by: session.name,
          text:
            session.role === "CUSTOMER"
              ? "Ticket raised by resident."
              : `Ticket raised by ${session.name} on the resident's behalf.`,
        },
      ],
    });

    return ok({ ok: true, ticketId: String(res.insertedId) }, 201);
  } catch (err) {
    return fail(err);
  }
}
