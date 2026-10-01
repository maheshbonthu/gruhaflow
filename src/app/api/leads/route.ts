import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { collections } from "@/lib/mongodb";
import { fail, ok } from "@/lib/api";
import { DEAD_STAGES, LEAD_SOURCES, LEAD_STAGES } from "@/lib/types";

const CreateLead = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().regex(/^[0-9+\-\s]{10,15}$/, "Enter a valid phone number"),
  email: z.string().email().optional().or(z.literal("")),
  source: z.enum(LEAD_SOURCES),
  projectId: z.string().optional(),
  assignedAgentId: z.string().optional(),
  budgetMin: z.coerce.number().min(0).optional(),
  budgetMax: z.coerce.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireRole("ADMIN", "MANAGER", "AGENT");
    const body = CreateLead.parse(await req.json());
    const leads = await collections.leads();

    const duplicate = await leads.findOne({ phone: body.phone });
    if (duplicate) {
      return ok(
        { error: `That number is already in the pipeline as "${duplicate.name}".`, leadId: String(duplicate._id) },
        409
      );
    }

    const now = new Date();
    // Agents can only create leads for themselves; back office may assign.
    const assignee =
      session.role === "AGENT"
        ? session.uid
        : body.assignedAgentId && ObjectId.isValid(body.assignedAgentId)
          ? body.assignedAgentId
          : undefined;

    const res = await leads.insertOne({
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email ? body.email.toLowerCase() : undefined,
      source: body.source,
      projectId:
        body.projectId && ObjectId.isValid(body.projectId) ? new ObjectId(body.projectId) : undefined,
      assignedAgentId: assignee ? new ObjectId(assignee) : undefined,
      stage: "NEW",
      budgetMin: body.budgetMin,
      budgetMax: body.budgetMax,
      notes: body.notes,
      callCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return ok({ ok: true, leadId: String(res.insertedId) }, 201);
  } catch (err) {
    return fail(err);
  }
}

const ALL_STAGES = [...LEAD_STAGES, ...DEAD_STAGES] as const;

/** Bulk stage move, used by the admin lead table. */
const BulkPatch = z.object({
  ids: z.array(z.string()).min(1).max(200),
  stage: z.enum(ALL_STAGES).optional(),
  assignedAgentId: z.string().optional(),
});

export async function PATCH(req: Request) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const body = BulkPatch.parse(await req.json());
    const leads = await collections.leads();

    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (body.stage) set.stage = body.stage;
    if (body.assignedAgentId && ObjectId.isValid(body.assignedAgentId)) {
      set.assignedAgentId = new ObjectId(body.assignedAgentId);
    }

    const ids = body.ids.filter(ObjectId.isValid).map((id) => new ObjectId(id));
    const res = await leads.updateMany({ _id: { $in: ids } }, { $set: set });
    return ok({ ok: true, modified: res.modifiedCount });
  } catch (err) {
    return fail(err);
  }
}
