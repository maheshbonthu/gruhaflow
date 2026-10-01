import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { collections } from "@/lib/mongodb";
import { fail, ok } from "@/lib/api";
import { TICKET_STATUSES } from "@/lib/types";

const Body = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  vendorId: z.string().optional(),
  comment: z.string().max(1000).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    if (!ObjectId.isValid(id)) return ok({ error: "Bad ticket id" }, 400);

    const body = Body.parse(await req.json());
    const tickets = await collections.tickets();
    const vendors = await collections.vendors();

    const ticket = await tickets.findOne({ _id: new ObjectId(id) });
    if (!ticket) return ok({ error: "Ticket not found" }, 404);

    const isOwner = String(ticket.customerId) === session.uid;
    const isStaff = session.role !== "CUSTOMER";
    if (!isOwner && !isStaff) return ok({ error: "Not your ticket." }, 403);

    // A resident can add a comment and close their own ticket; nothing else.
    if (!isStaff && body.status && body.status !== "CLOSED") {
      return ok({ error: "Only the facility team can change the status." }, 403);
    }
    if (!isStaff && body.vendorId) {
      return ok({ error: "Only the facility team can assign a vendor." }, 403);
    }

    const now = new Date();
    const set: Record<string, unknown> = {};
    const events: Array<{ at: Date; by: string; text: string }> = [];

    if (body.vendorId && ObjectId.isValid(body.vendorId)) {
      const vendor = await vendors.findOne({ _id: new ObjectId(body.vendorId) });
      set.vendorId = new ObjectId(body.vendorId);
      if (ticket.status === "OPEN") set.status = "ASSIGNED";
      events.push({ at: now, by: session.name, text: `Assigned to ${vendor?.name ?? "a vendor"}.` });
    }

    if (body.status) {
      set.status = body.status;
      if (body.status === "RESOLVED" || body.status === "CLOSED") {
        set.resolvedAt = ticket.resolvedAt ?? now;
      }
      events.push({ at: now, by: session.name, text: `Status changed to ${body.status.toLowerCase().replace("_", " ")}.` });
    }

    if (body.comment?.trim()) {
      events.push({ at: now, by: session.name, text: body.comment.trim() });
    }

    if (!Object.keys(set).length && !events.length) {
      return ok({ error: "Nothing to update." }, 422);
    }

    await tickets.updateOne(
      { _id: ticket._id },
      { $set: set, ...(events.length ? { $push: { timeline: { $each: events } } } : {}) }
    );

    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
