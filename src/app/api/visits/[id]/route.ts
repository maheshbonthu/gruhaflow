import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { collections } from "@/lib/mongodb";
import { fail, ok } from "@/lib/api";
import { stageIndex } from "@/lib/types";

const Body = z.object({
  status: z.enum(["SCHEDULED", "COMPLETED", "NO_SHOW", "CANCELLED"]),
  feedback: z.string().max(2000).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

/**
 * Marking a visit COMPLETED is what makes the "really came to the location"
 * number move — it is deliberately a separate action from scheduling.
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("ADMIN", "MANAGER", "AGENT");
    const { id } = await ctx.params;
    if (!ObjectId.isValid(id)) return ok({ error: "Bad visit id" }, 400);

    const body = Body.parse(await req.json());
    const visits = await collections.visits();
    const leads = await collections.leads();

    const visit = await visits.findOne({ _id: new ObjectId(id) });
    if (!visit) return ok({ error: "Visit not found" }, 404);

    const now = new Date();
    await visits.updateOne(
      { _id: visit._id },
      {
        $set: {
          status: body.status,
          feedback: body.feedback,
          rating: body.rating,
          visitedAt: body.status === "COMPLETED" ? now : undefined,
        },
      }
    );

    if (body.status === "COMPLETED") {
      const lead = await leads.findOne({ _id: visit.leadId });
      if (lead && stageIndex(lead.stage) < stageIndex("SITE_VISITED")) {
        await leads.updateOne(
          { _id: lead._id },
          { $set: { stage: "SITE_VISITED", visitedAt: lead.visitedAt ?? now, updatedAt: now } }
        );
      }
    }

    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
