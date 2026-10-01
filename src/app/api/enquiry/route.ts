import { ObjectId } from "mongodb";
import { z } from "zod";
import { collections } from "@/lib/mongodb";
import { fail, ok } from "@/lib/api";

const Body = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().regex(/^[0-9+\-\s]{10,15}$/, "Enter a valid 10-digit phone number"),
  email: z.string().email().optional().or(z.literal("")),
  projectId: z.string().optional(),
  message: z.string().max(1000).optional(),
  budgetMin: z.coerce.number().min(0).optional(),
  budgetMax: z.coerce.number().min(0).optional(),
});

/**
 * Public endpoint behind the "Contact builder" form on a listing page. It is the
 * top of the funnel: an enquiry becomes a NEW lead, round-robin assigned to the
 * caller with the smallest open pipeline so nothing sits untouched.
 *
 * Deliberately unauthenticated, so it only ever creates a lead — it cannot read
 * or change anything, and a repeat enquiry appends a note instead of duplicating.
 */
export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const leads = await collections.leads();
    const users = await collections.users();
    const projects = await collections.projects();

    const projectId =
      body.projectId && ObjectId.isValid(body.projectId) ? new ObjectId(body.projectId) : undefined;
    const project = projectId ? await projects.findOne({ _id: projectId }) : null;

    const now = new Date();
    const enquiryNote = [
      `Website enquiry on ${now.toLocaleString("en-IN")}`,
      project ? `Project: ${project.name}` : null,
      body.message?.trim() ? `Message: ${body.message.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const existing = await leads.findOne({ phone: body.phone.trim() });
    if (existing) {
      await leads.updateOne(
        { _id: existing._id },
        {
          $set: {
            updatedAt: now,
            notes: [existing.notes, enquiryNote].filter(Boolean).join("\n\n"),
            ...(projectId && !existing.projectId ? { projectId } : {}),
          },
        }
      );
      return ok({
        ok: true,
        duplicate: true,
        message: "We already have your details — your advisor will call you shortly.",
      });
    }

    // Round-robin on open pipeline size, not a random pick.
    const callers = await users
      .find({ role: { $in: ["AGENT", "MANAGER"] }, active: true })
      .project<{ _id: ObjectId }>({ _id: 1 })
      .toArray();

    let assignee: ObjectId | undefined;
    if (callers.length) {
      const loads = await Promise.all(
        callers.map(async (c) => ({
          id: c._id,
          n: await leads.countDocuments({
            assignedAgentId: c._id,
            stage: { $nin: ["BOOKED", "NOT_INTERESTED", "LOST"] },
          }),
        }))
      );
      loads.sort((a, b) => a.n - b.n);
      assignee = loads[0]?.id;
    }

    const res = await leads.insertOne({
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email ? body.email.toLowerCase() : undefined,
      source: "WEBSITE",
      projectId,
      assignedAgentId: assignee,
      stage: "NEW",
      budgetMin: body.budgetMin,
      budgetMax: body.budgetMax,
      notes: enquiryNote,
      callCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return ok(
      {
        ok: true,
        leadId: String(res.insertedId),
        message: "Thanks! An advisor will call you within one working day.",
      },
      201
    );
  } catch (err) {
    return fail(err);
  }
}
