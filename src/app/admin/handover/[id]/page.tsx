import Link from "next/link";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import {
  Badge,
  Card,
  Empty,
  PageHeader,
  Progress,
  Stat,
  StatGrid,
  Table,
  Td,
  Th,
  toneForStatus,
} from "@/components/ui";
import { fmtDate, inr, pct } from "@/lib/fmt";
import { collections } from "@/lib/mongodb";
import { journeyProgress } from "@/lib/booking";
import StepRow from "./StepRow";

export const dynamic = "force-dynamic";

export default async function HandoverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) notFound();

  const bookingsCol = await collections.bookings();
  const booking = await bookingsCol.findOne({ _id: new ObjectId(id) });
  if (!booking) notFound();

  const [units, projects, users, journeyCol, paymentsCol, ticketsCol] = await Promise.all([
    collections.units(),
    collections.projects(),
    collections.users(),
    collections.journey(),
    collections.payments(),
    collections.tickets(),
  ]);

  const [unit, project, customer, agent, steps, payments, tickets] = await Promise.all([
    units.findOne({ _id: booking.unitId }),
    projects.findOne({ _id: booking.projectId }),
    users.findOne({ _id: booking.customerId }),
    users.findOne({ _id: booking.agentId }),
    journeyCol.find({ bookingId: booking._id }).sort({ order: 1 }).toArray(),
    paymentsCol.find({ bookingId: booking._id }).sort({ dueAt: 1 }).toArray(),
    ticketsCol.find({ customerId: booking.customerId }).sort({ createdAt: -1 }).limit(5).toArray(),
  ]);

  const progress = journeyProgress(steps);
  const paid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const now = Date.now();
  const overdue = steps.filter((s) => s.status !== "DONE" && s.dueAt.getTime() < now);

  return (
    <div>
      <Link href="/admin/handover" className="dim text-sm hover:underline">
        ← Handover tracker
      </Link>

      <PageHeader
        title={`${booking.code} · ${customer?.name ?? "Buyer"}`}
        subtitle={`${project?.name ?? "—"} · Unit ${unit?.unitNo ?? "—"} · ${unit?.bhk ?? "—"} BHK · ${unit?.sqft ?? "—"} sqft`}
        action={
          <Badge tone={toneForStatus(booking.status)}>
            {booking.status === "HANDED_OVER" ? "Handed over" : "Active"}
          </Badge>
        }
      />

      <StatGrid cols={4}>
        <Stat label="Handover progress" value={`${progress}%`} tone="brand" hint={`${steps.filter((s) => s.status === "DONE").length} of ${steps.length} done`} />
        <Stat label="Booking value" value={inr(booking.totalAmount)} />
        <Stat label="Collected" value={inr(paid)} tone="good" hint={pct(paid, booking.totalAmount)} />
        <Stat
          label="Overdue milestones"
          value={overdue.length}
          tone={overdue.length ? "bad" : "good"}
        />
      </StatGrid>

      <div className="mt-4">
        <Progress value={progress} tone={overdue.length ? "warn" : "brand"} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Handover checklist"
          subtitle="Change a status and the buyer's portal updates immediately."
        >
          <ul className="space-y-1">
            {steps.map((step) => (
              <StepRow
                key={String(step._id)}
                id={String(step._id)}
                title={step.title}
                owner={step.owner}
                status={step.status}
                dueAt={step.dueAt.toISOString()}
                completedAt={step.completedAt?.toISOString()}
                note={step.note}
              />
            ))}
          </ul>
        </Card>

        <div className="space-y-5">
          <Card title="Buyer & advisor">
            <dl className="space-y-2.5 text-sm">
              {[
                ["Buyer", customer?.name ?? "—"],
                ["Email", customer?.email ?? "—"],
                ["Phone", customer?.phone ?? "—"],
                ["Sales advisor", agent?.name ?? "—"],
                ["Booked on", fmtDate(booking.bookingDate)],
                ["Possession", project?.possession ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="dim">{k}</dt>
                  <dd className="truncate text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card title="Payment schedule" subtitle="Construction-linked plan.">
            <Table>
              <thead>
                <tr>
                  <Th>Stage</Th>
                  <Th align="right">Amount</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={String(p._id)}>
                    <Td>
                      <p className="text-sm">{p.label}</p>
                      <p className="dim text-xs">{fmtDate(p.dueAt)}</p>
                    </Td>
                    <Td align="right" className="whitespace-nowrap tabular-nums">{inr(p.amount)}</Td>
                    <Td>
                      <Badge
                        tone={
                          p.status === "PAID"
                            ? "good"
                            : p.dueAt.getTime() < now
                              ? "bad"
                              : "warn"
                        }
                      >
                        {p.status === "PAID" ? "Paid" : p.dueAt.getTime() < now ? "Overdue" : "Due"}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          <Card
            title="Recent service requests"
            subtitle="Raised by this resident."
            action={
              <Link href="/admin/services" className="text-brand-600 dark:text-brand-300 text-sm hover:underline">
                Service desk →
              </Link>
            }
          >
            {tickets.length === 0 ? (
              <Empty>No service requests yet.</Empty>
            ) : (
              <ul className="space-y-2.5">
                {tickets.map((t) => (
                  <li key={String(t._id)} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{t.title}</p>
                      <p className="dim text-xs">{t.code} · {fmtDate(t.createdAt)}</p>
                    </div>
                    <Badge tone={toneForStatus(t.status)}>{t.status.replace("_", " ")}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
