import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { collections } from "@/lib/mongodb";
import { fail, ok } from "@/lib/api";
import { STEP_STATUSES } from "@/lib/types";

const Body = z.object({
  status: z.enum(STEP_STATUSES),
  note: z.string().max(1000).optional(),
});

/**
 * Moves one handover milestone. Completing the final step (Gruha Pravesham)
 * flips the booking itself to HANDED_OVER, which is what moves the buyer from
 * "under construction" into the maintenance-services world.
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("ADMIN", "MANAGER");
    const { id } = await ctx.params;
    if (!ObjectId.isValid(id)) return ok({ error: "Bad step id" }, 400);

    const body = Body.parse(await req.json());
    const journey = await collections.journey();
    const bookings = await collections.bookings();

    const step = await journey.findOne({ _id: new ObjectId(id) });
    if (!step) return ok({ error: "Step not found" }, 404);

    await journey.updateOne(
      { _id: step._id },
      {
        $set: {
          status: body.status,
          note: body.note,
          completedAt: body.status === "DONE" ? (step.completedAt ?? new Date()) : undefined,
        },
      }
    );

    const remaining = await journey.countDocuments({
      bookingId: step.bookingId,
      status: { $ne: "DONE" },
    });
    await bookings.updateOne(
      { _id: step.bookingId },
      { $set: { status: remaining === 0 ? "HANDED_OVER" : "ACTIVE" } }
    );

    return ok({ ok: true, handedOver: remaining === 0 });
  } catch (err) {
    return fail(err);
  }
}
