import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { convertLeadToBooking } from "@/lib/booking";
import { fail, ok } from "@/lib/api";

const Body = z.object({
  leadId: z.string(),
  unitId: z.string(),
  totalAmount: z.coerce.number().positive().optional(),
});

/**
 * The hand-off point between sales and operations: converts a lead into a
 * booking, creates the buyer's portal login, and lays down the full handover
 * checklist plus the construction-linked payment plan.
 */
export async function POST(req: Request) {
  try {
    const session = await requireRole("ADMIN", "MANAGER", "AGENT");
    const body = Body.parse(await req.json());

    const result = await convertLeadToBooking({
      leadId: body.leadId,
      unitId: body.unitId,
      agentId: session.uid,
      totalAmount: body.totalAmount,
    });

    return ok({ ok: true, ...result }, 201);
  } catch (err) {
    return fail(err);
  }
}
