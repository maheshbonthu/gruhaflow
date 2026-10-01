import { redirect } from "next/navigation";
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
import { getSession } from "@/lib/auth";
import { fmtDate, inr, inrExact, pct, relative } from "@/lib/fmt";
import { getCustomerView } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment schedule — The Urban Firm" };

export default async function PaymentsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/portal/payments");

  const view = await getCustomerView(session.uid);
  if (!view.booking) {
    return (
      <div>
        <PageHeader title="Payment schedule" />
        <Card>
          <Empty>No booking is linked to this account yet.</Empty>
        </Card>
      </div>
    );
  }

  const b = view.booking;
  const now = Date.now();
  const outstanding = b.totalAmount - view.paid;
  const overdue = view.payments.filter((p) => p.status !== "PAID" && p.dueAt.getTime() < now);

  return (
    <div>
      <PageHeader
        title="Payment schedule"
        subtitle={`Construction-linked plan for ${b.projectName}, unit ${b.unitNo}. Instalments fall due as each stage completes.`}
      />

      <StatGrid cols={4}>
        <Stat label="Agreement value" value={inr(b.totalAmount)} />
        <Stat label="Paid so far" value={inr(view.paid)} tone="good" hint={pct(view.paid, b.totalAmount)} />
        <Stat label="Still to pay" value={inr(outstanding)} tone={outstanding ? "warn" : "good"} />
        <Stat
          label="Overdue instalments"
          value={overdue.length}
          tone={overdue.length ? "bad" : "good"}
          hint={overdue.length ? inrExact(overdue.reduce((s, p) => s + p.amount, 0)) : "Nothing overdue"}
        />
      </StatGrid>

      <div className="mt-4">
        <Progress value={Math.round((view.paid / b.totalAmount) * 100)} tone={overdue.length ? "bad" : "brand"} />
      </div>

      <Card className="mt-5" title="Instalments" subtitle="Earliest first.">
        <Table>
          <thead>
            <tr>
              <Th>Stage</Th>
              <Th align="right">Amount</Th>
              <Th align="right">Share</Th>
              <Th>Due date</Th>
              <Th>Status</Th>
              <Th>Receipt</Th>
            </tr>
          </thead>
          <tbody>
            {view.payments.map((p) => {
              const isOverdue = p.status !== "PAID" && p.dueAt.getTime() < now;
              return (
                <tr key={String(p._id)}>
                  <Td className="font-medium">{p.label}</Td>
                  <Td align="right" className="whitespace-nowrap tabular-nums">{inrExact(p.amount)}</Td>
                  <Td align="right" className="tabular-nums">
                    {((p.amount / b.totalAmount) * 100).toFixed(0)}%
                  </Td>
                  <Td className="whitespace-nowrap text-xs">
                    {fmtDate(p.dueAt)}
                    {p.status !== "PAID" && (
                      <span className="dim"> · {relative(p.dueAt)}</span>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={p.status === "PAID" ? "good" : isOverdue ? "bad" : "warn"}>
                      {p.status === "PAID" ? "Paid" : isOverdue ? "Overdue" : "Due"}
                    </Badge>
                  </Td>
                  <Td className="dim whitespace-nowrap text-xs">
                    {p.paidAt ? `Received ${fmtDate(p.paidAt)}` : "—"}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      <Card className="mt-5" title="How to pay">
        <p className="text-sm">
          Transfers go to the project's RERA-designated escrow account. Your advisor{" "}
          <strong>{b.agentName}</strong> ({b.agentPhone}) sends the account details and the demand
          letter before each instalment falls due. Receipts appear here within two working days of the
          transfer clearing.
        </p>
        <p className="dim mt-3 text-xs">
          This is a demonstration build, so no payment gateway is connected and no money moves.
        </p>
      </Card>
    </div>
  );
}
