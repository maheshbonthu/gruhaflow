import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { collections } from "@/lib/mongodb";
import { fail, ok } from "@/lib/api";
import { DEAD_STAGES, LEAD_STAGES } from "@/lib/types";

const ALL_STAGES = [...LEAD_STAGES, ...DEAD_STAGES] as const;

const Patch = z.object({
  stage: z.enum(ALL_STAGES).optional(),
  assignedAgentId: z.string().optional(),
  notes: z.string().max(2000).optional(),
  budgetMin: z.coerce.number().optional(),
  budgetMax: z.coerce.number().optional(),
});

/** Timestamps we backfill when a lead crosses a milestone for the first time. */
const STAGE_STAMPS: Record<string, string> = {
  INTERESTED: "interestedAt",
  SITE_VISITED: "visitedAt",
  BOOKED: "bookedAt",
};

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("ADMIN", "MANAGER", "AGENT");
    const { id } = await ctx.params;
    if (!ObjectId.isValid(id)) return ok({ error: "Bad lead id" }, 400);

    const body = Patch.parse(await req.json());
    const leads = await collections.leads();
    const lead = await leads.findOne({ _id: new ObjectId(id) });
    if (!lead) return ok({ error: "Lead not found" }, 404);

    // An agent may only touch their own leads.
    if (session.role === "AGENT" && String(lead.assignedAgentId) !== session.uid) {
      return ok({ error: "That lead is not assigned to you." }, 403);
    }

    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (body.stage) {
      set.stage = body.stage;
      const stamp = STAGE_STAMPS[body.stage];
      if (stamp && !lead[stamp as keyof typeof lead]) set[stamp] = new Date();
    }
    if (body.notes !== undefined) set.notes = body.notes;
    if (body.budgetMin !== undefined) set.budgetMin = body.budgetMin;
    if (body.budgetMax !== undefined) set.budgetMax = body.budgetMax;
    if (body.assignedAgentId && ObjectId.isValid(body.assignedAgentId)) {
      if (session.role === "AGENT") {
        return ok({ error: "Only a manager can reassign a lead." }, 403);
      }
      set.assignedAgentId = new ObjectId(body.assignedAgentId);
    }

    await leads.updateOne({ _id: lead._id }, { $set: set });
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("ADMIN");
    const { id } = await ctx.params;
    if (!ObjectId.isValid(id)) return ok({ error: "Bad lead id" }, 400);

    const bookings = await collections.bookings();
    const booked = await bookings.findOne({ leadId: new ObjectId(id) });
    if (booked) {
      return ok({ error: "This lead has a booking against it and cannot be deleted." }, 409);
    }

    const leads = await collections.leads();
    const calls = await collections.calls();
    const visits = await collections.visits();
    await Promise.all([
      leads.deleteOne({ _id: new ObjectId(id) }),
      calls.deleteMany({ leadId: new ObjectId(id) }),
      visits.deleteMany({ leadId: new ObjectId(id) }),
    ]);
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
