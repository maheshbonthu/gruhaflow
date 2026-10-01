import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { collections } from "@/lib/mongodb";
import { fail, ok } from "@/lib/api";
import {
  CALL_DISPOSITIONS,
  CALL_OUTCOMES,
  hasReached,
  stageIndex,
  type AnyStage,
  type CallDisposition,
  type CallOutcome,
} from "@/lib/types";

const Body = z.object({
  leadId: z.string(),
  outcome: z.enum(CALL_OUTCOMES),
  disposition: z.enum(CALL_DISPOSITIONS).default("NO_DISPOSITION"),
  durationSec: z.coerce.number().int().min(0).max(7200).default(0),
  notes: z.string().max(2000).optional(),
  nextFollowUpAt: z.string().datetime().optional().or(z.literal("")),
  /** Optional slot to book a site visit in the same action. */
  visitAt: z.string().datetime().optional().or(z.literal("")),
});

/**
 * Where the lead should sit after this call. Never moves a lead backwards along
 * the funnel — a "callback later" on someone who already visited the site must
 * not drag them back to CALLED.
 */
function nextStage(current: AnyStage, outcome: CallOutcome, disposition: CallDisposition): AnyStage {
  if (outcome !== "CONNECTED") {
    if (outcome === "WRONG_NUMBER") return "UNREACHABLE";
    return current === "NEW" ? "CALLED" : current;
  }

  const target: AnyStage =
    disposition === "NOT_INTERESTED" || disposition === "BUDGET_MISMATCH" || disposition === "ALREADY_BOUGHT"
      ? "NOT_INTERESTED"
      : disposition === "SITE_VISIT_BOOKED"
        ? "SITE_VISIT_SCHEDULED"
        : disposition === "INTERESTED"
          ? "INTERESTED"
          : "CALLED";

  // Dead-end dispositions always win; forward stages only move forward.
  if (target === "NOT_INTERESTED") return target;
  return stageIndex(target) > stageIndex(current) ? target : current;
}

export async function POST(req: Request) {
  try {
    const session = await requireRole("ADMIN", "MANAGER", "AGENT");
    const body = Body.parse(await req.json());
    if (!ObjectId.isValid(body.leadId)) return ok({ error: "Bad lead id" }, 400);

    const leads = await collections.leads();
    const calls = await collections.calls();
    const visits = await collections.visits();

    const lead = await leads.findOne({ _id: new ObjectId(body.leadId) });
    if (!lead) return ok({ error: "Lead not found" }, 404);
    if (session.role === "AGENT" && lead.assignedAgentId && String(lead.assignedAgentId) !== session.uid) {
      return ok({ error: "That lead is not assigned to you." }, 403);
    }

    const now = new Date();
    const agentId = new ObjectId(session.uid);

    await calls.insertOne({
      leadId: lead._id!,
      agentId,
      outcome: body.outcome,
      disposition: body.disposition,
      durationSec: body.durationSec,
      notes: body.notes,
      nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : undefined,
      createdAt: now,
    });

    const stage = nextStage(lead.stage, body.outcome, body.disposition);
    const set: Record<string, unknown> = { stage, lastCallAt: now, updatedAt: now };
    if (hasReached(stage, "INTERESTED") && !lead.interestedAt) set.interestedAt = now;

    await leads.updateOne({ _id: lead._id }, { $set: set, $inc: { callCount: 1 } });

    // An unassigned lead becomes the caller's the moment they work it.
    if (!lead.assignedAgentId) {
      await leads.updateOne({ _id: lead._id }, { $set: { assignedAgentId: agentId } });
    }

    let visitId: string | undefined;
    if (body.visitAt) {
      const res = await visits.insertOne({
        leadId: lead._id!,
        agentId,
        projectId: lead.projectId,
        scheduledAt: new Date(body.visitAt),
        status: "SCHEDULED",
      });
      visitId = String(res.insertedId);
      await leads.updateOne(
        { _id: lead._id },
        { $set: { stage: "SITE_VISIT_SCHEDULED", updatedAt: now } }
      );
    }

    return ok({ ok: true, stage: body.visitAt ? "SITE_VISIT_SCHEDULED" : stage, visitId }, 201);
  } catch (err) {
    return fail(err);
  }
}
