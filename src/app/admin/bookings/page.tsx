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
  toneForStatus,
} from "@/components/ui";
import { fmtDate, inr, pct } from "@/lib/fmt";
import { listBookings } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bookings — The Urban Firm" };

export default async function BookingsPage() {
  const bookings = await listBookings();

  const totalValue = bookings.reduce((s, b) => s + b.totalAmount, 0);
  const collected = bookings.reduce((s, b) => s + b.paidAmount, 0);
  const handedOver = bookings.filter((b) => b.status === "HANDED_OVER").length;
  const atRisk = bookings.filter((b) => b.overdueSteps > 0).length;

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Every lead that became a buyer, and how far each one has got since."
      />

      <StatGrid cols={4}>
        <Stat label="Total bookings" value={bookings.length} hint={`${handedOver} handed over`} />
        <Stat label="Booked value" value={inr(totalValue)} tone="brand" />
        <Stat
          label="Collected"
          value={inr(collected)}
          tone="good"
          hint={`${pct(collected, totalValue)} of booked value`}
        />
        <Stat
          label="Behind schedule"
          value={atRisk}
          tone={atRisk ? "bad" : "good"}
          hint="Bookings with an overdue milestone"
        />
      </StatGrid>

      <Card className="mt-5">
        {bookings.length === 0 ? (
          <Empty>
            No bookings yet. Convert a lead from a lead page to create the first one.
          </Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Booking</Th>
                <Th>Buyer</Th>
                <Th>Project / unit</Th>
                <Th align="right">Value</Th>
                <Th align="right">Collected</Th>
                <Th>Booked on</Th>
                <Th>Handover progress</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <Td className="font-mono text-xs whitespace-nowrap">{b.code}</Td>
                  <Td>
                    <p className="font-medium">{b.customerName}</p>
                    <p className="dim text-xs">{b.customerEmail}</p>
                  </Td>
                  <Td className="whitespace-nowrap">
                    <p>{b.projectName}</p>
                    <p className="dim text-xs">
                      {b.unitNo} · {b.bhk} BHK
                    </p>
                  </Td>
                  <Td align="right" className="whitespace-nowrap tabular-nums">{inr(b.totalAmount)}</Td>
                  <Td align="right" className="whitespace-nowrap tabular-nums">{inr(b.paidAmount)}</Td>
                  <Td className="whitespace-nowrap text-xs">{fmtDate(b.bookingDate)}</Td>
                  <Td className="min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <Progress value={b.progress} tone={b.overdueSteps ? "bad" : "brand"} />
                      <span className="dim w-9 text-right text-xs tabular-nums">{b.progress}%</span>
                    </div>
                    <p className="dim mt-1 truncate text-xs">{b.nextStep ?? "All steps complete"}</p>
                  </Td>
                  <Td>
                    <Badge tone={toneForStatus(b.status)}>
                      {b.status === "HANDED_OVER" ? "Handed over" : "Active"}
                    </Badge>
                    {b.overdueSteps > 0 && (
                      <p className="mt-1">
                        <Badge tone="bad">{b.overdueSteps} overdue</Badge>
                      </p>
                    )}
                  </Td>
                  <Td align="right">
                    <Link
                      href={`/admin/handover/${b.id}`}
                      className="text-brand-600 dark:text-brand-300 text-sm whitespace-nowrap hover:underline"
                    >
                      Track →
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
