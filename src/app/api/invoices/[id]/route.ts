import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { collections } from "@/lib/mongodb";
import { fail, ok } from "@/lib/api";

const Body = z.object({
  action: z.enum(["MARK_PAID", "MARK_DUE"]),
});

/**
 * There is no payment gateway wired up here, so "paying" a maintenance invoice
 * records the receipt. A resident may settle their own bill; staff may correct
 * either way.
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    if (!ObjectId.isValid(id)) return ok({ error: "Bad invoice id" }, 400);

    const { action } = Body.parse(await req.json());
    const invoices = await collections.invoices();
    const invoice = await invoices.findOne({ _id: new ObjectId(id) });
    if (!invoice) return ok({ error: "Invoice not found" }, 404);

    const isStaff = session.role !== "CUSTOMER";
    if (!isStaff && String(invoice.customerId) !== session.uid) {
      return ok({ error: "Not your invoice." }, 403);
    }
    if (!isStaff && action === "MARK_DUE") {
      return ok({ error: "Only the accounts team can reopen an invoice." }, 403);
    }

    if (action === "MARK_PAID") {
      await invoices.updateOne(
        { _id: invoice._id },
        { $set: { status: "PAID", paidAt: new Date() } }
      );
    } else {
      const overdue = invoice.dueAt.getTime() < Date.now();
      await invoices.updateOne(
        { _id: invoice._id },
        { $set: { status: overdue ? "OVERDUE" : "DUE" }, $unset: { paidAt: "" } }
      );
    }

    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
