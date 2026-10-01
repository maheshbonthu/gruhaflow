import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { collections } from "@/lib/mongodb";
import { fail, ok } from "@/lib/api";
import { stageIndex } from "@/lib/types";

const Body = z.object({
  leadId: z.string(),
  scheduledAt: z.string().datetime(),
});

export async function POST(req: Request) {
  try {
    const session = await requireRole("ADMIN", "MANAGER", "AGENT");
    const body = Body.parse(await req.json());
    if (!ObjectId.isValid(body.leadId)) return ok({ error: "Bad lead id" }, 400);

    const leads = await collections.leads();
    const visits = await collections.visits();
    const lead = await leads.findOne({ _id: new ObjectId(body.leadId) });
    if (!lead) return ok({ error: "Lead not found" }, 404);

    const res = await visits.insertOne({
      leadId: lead._id!,
      agentId: new ObjectId(session.uid),
      projectId: lead.projectId,
      scheduledAt: new Date(body.scheduledAt),
      status: "SCHEDULED",
    });

    if (stageIndex(lead.stage) < stageIndex("SITE_VISIT_SCHEDULED")) {
      await leads.updateOne(
        { _id: lead._id },
        { $set: { stage: "SITE_VISIT_SCHEDULED", updatedAt: new Date() } }
      );
    }

    return ok({ ok: true, visitId: String(res.insertedId) }, 201);
  } catch (err) {
    return fail(err);
  }
}
