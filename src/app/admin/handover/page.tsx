import Link from "next/link";
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
} from "@/components/ui";
import { fmtDate } from "@/lib/fmt";
import { collections } from "@/lib/mongodb";
import { listBookings } from "@/lib/queries";
import { JOURNEY_STEPS } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Handover tracker — GruhaFlow" };

export default async function HandoverPage() {
  const bookings = await listBookings();
  const journey = await collections.journey();

  // Which milestone is the whole business stuck on? Count blocked and overdue
  // steps per milestone so the bottleneck is obvious.
  const now = new Date();
  const [blockedRows, overdueRows] = await Promise.all([
    journey
      .aggregate<{ _id: string; n: number }>([
        { $match: { status: "BLOCKED" } },
        { $group: { _id: "$title", n: { $sum: 1 } } },
        { $sort: { n: -1 } },
      ])
      .toArray(),
    journey
      .aggregate<{ _id: string; n: number }>([
        { $match: { status: { $ne: "DONE" }, dueAt: { $lt: now } } },
        { $group: { _id: "$title", n: { $sum: 1 } } },
        { $sort: { n: -1 } },
      ])
      .toArray(),
  ]);

  const active = bookings.filter((b) => b.status !== "HANDED_OVER");
  const done = bookings.filter((b) => b.status === "HANDED_OVER");
  const avgProgress = bookings.length
    ? Math.round(bookings.reduce((s, b) => s + b.progress, 0) / bookings.length)
    : 0;

  return (
    <div>
      <PageHeader
        title="Handover tracker"
        subtitle={`Every booking's path to Gruha Pravesham, across ${JOURNEY_STEPS.length} milestones.`}
      />

      <StatGrid cols={4}>
        <Stat label="In progress" value={active.length} hint="Booked, not yet handed over" />
        <Stat label="Completed" value={done.length} tone="good" hint="Keys handed over" />
        <Stat label="Average progress" value={`${avgProgress}%`} tone="brand" />
        <Stat
          label="Overdue milestones"
          value={overdueRows.reduce((s, r) => s + r.n, 0)}
          tone={overdueRows.length ? "bad" : "good"}
        />
      </StatGrid>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card title="Where handovers are stuck" subtitle="Milestones past their due date, worst first.">
          {overdueRows.length === 0 ? (
            <Empty>Nothing is overdue.</Empty>
          ) : (
            <ul className="space-y-2.5">
              {overdueRows.slice(0, 8).map((r) => (
                <li key={r._id} className="flex items-center justify-between gap-3 text-sm">
                  <span>{r._id}</span>
                  <Badge tone="bad">{r.n} overdue</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Actively blocked" subtitle="Someone marked these as blocked and they need a decision.">
          {blockedRows.length === 0 ? (
            <Empty>Nothing is flagged as blocked.</Empty>
          ) : (
            <ul className="space-y-2.5">
              {blockedRows.slice(0, 8).map((r) => (
                <li key={r._id} className="flex items-center justify-between gap-3 text-sm">
                  <span>{r._id}</span>
                  <Badge tone="warn">{r.n} blocked</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-5" title="All bookings" subtitle="Open one to move its milestones.">
        {bookings.length === 0 ? (
          <Empty>No bookings to track yet.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Booking</Th>
                <Th>Buyer</Th>
                <Th>Unit</Th>
                <Th>Booked</Th>
                <Th>Progress</Th>
                <Th>Current milestone</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <Td className="font-mono text-xs whitespace-nowrap">{b.code}</Td>
                  <Td className="whitespace-nowrap">{b.customerName}</Td>
                  <Td className="dim whitespace-nowrap text-xs">
                    {b.projectName} · {b.unitNo}
                  </Td>
                  <Td className="whitespace-nowrap text-xs">{fmtDate(b.bookingDate)}</Td>
                  <Td className="min-w-[150px]">
                    <div className="flex items-center gap-2">
                      <Progress value={b.progress} tone={b.overdueSteps ? "warn" : "brand"} />
                      <span className="dim w-9 text-right text-xs tabular-nums">{b.progress}%</span>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-sm">{b.nextStep ?? "Gruha Pravesham done"}</span>
                    {b.overdueSteps > 0 && (
                      <span className="ml-2">
                        <Badge tone="bad">{b.overdueSteps} overdue</Badge>
                      </span>
                    )}
                  </Td>
                  <Td align="right">
                    <Link
                      href={`/admin/handover/${b.id}`}
                      className="text-brand-600 dark:text-brand-300 text-sm whitespace-nowrap hover:underline"
                    >
                      Open →
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
