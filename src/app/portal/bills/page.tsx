import { redirect } from "next/navigation";
import {
  Badge,
  Card,
  Empty,
  PageHeader,
  Stat,
  StatGrid,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { getSession } from "@/lib/auth";
import { fmtDate, inrExact, relative } from "@/lib/fmt";
import { getCustomerView } from "@/lib/queries";
import PayBill from "./PayBill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Maintenance bills — GruhaFlow" };

export default async function BillsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/portal/bills");

  const view = await getCustomerView(session.uid);
  const now = Date.now();

  const unpaid = view.invoices.filter((i) => i.status !== "PAID");
  const overdue = unpaid.filter((i) => i.dueAt.getTime() < now);
  const dues = unpaid.reduce((s, i) => s + i.amount, 0);
  const paidTotal = view.invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <PageHeader
        title="Maintenance bills"
        subtitle={
          view.booking
            ? `Monthly charges for ${view.booking.projectName}, unit ${view.booking.unitNo}.`
            : "Monthly maintenance charges for your flat."
        }
      />

      <StatGrid cols={3}>
        <Stat
          label="Outstanding"
          value={dues ? inrExact(dues) : "₹0"}
          tone={dues ? "bad" : "good"}
          hint={`${unpaid.length} unpaid bills`}
        />
        <Stat
          label="Overdue"
          value={overdue.length}
          tone={overdue.length ? "bad" : "good"}
          hint={overdue.length ? inrExact(overdue.reduce((s, i) => s + i.amount, 0)) : "Nothing overdue"}
        />
        <Stat label="Paid to date" value={inrExact(paidTotal)} tone="good" />
      </StatGrid>

      <Card className="mt-5" title="All bills" subtitle="Most recent period first.">
        {view.invoices.length === 0 ? (
          <Empty>
            No maintenance bills yet. Billing begins the month after your flat is handed over.
          </Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Period</Th>
                <Th>What it covers</Th>
                <Th align="right">Amount</Th>
                <Th>Due</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {view.invoices.map((inv) => {
                const isOverdue = inv.status !== "PAID" && inv.dueAt.getTime() < now;
                return (
                  <tr key={String(inv._id)}>
                    <Td className="whitespace-nowrap font-medium">{inv.period}</Td>
                    <Td className="dim max-w-[280px] text-xs">
                      {inv.lines.map((l) => `${l.label} ${inrExact(l.amount)}`).join(" · ")}
                    </Td>
                    <Td align="right" className="whitespace-nowrap tabular-nums font-semibold">
                      {inrExact(inv.amount)}
                    </Td>
                    <Td className="whitespace-nowrap text-xs">
                      {fmtDate(inv.dueAt)}
                      {inv.status !== "PAID" && <span className="dim"> · {relative(inv.dueAt)}</span>}
                    </Td>
                    <Td>
                      <Badge tone={inv.status === "PAID" ? "good" : isOverdue ? "bad" : "warn"}>
                        {inv.status === "PAID" ? "Paid" : isOverdue ? "Overdue" : "Due"}
                      </Badge>
                      {inv.paidAt && <p className="dim mt-0.5 text-xs">{fmtDate(inv.paidAt)}</p>}
                    </Td>
                    <Td align="right">
                      {inv.status === "PAID" ? (
                        <span className="dim text-xs">Receipt issued</span>
                      ) : (
                        <PayBill id={String(inv._id)} amount={inv.amount} />
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Card className="mt-5" title="What you are paying for">
        <p className="text-sm">
          Maintenance covers the common areas, not the inside of your flat: lift and diesel-generator
          upkeep, water, security and housekeeping staff, landscaping, and a corpus contribution set
          aside for major repairs. Anything inside your own walls goes through a service request
          instead, and interior or carpentry work is quoted separately.
        </p>
        <p className="dim mt-3 text-xs">
          This is a demonstration build, so marking a bill paid records a receipt without any real
          payment being taken.
        </p>
      </Card>
    </div>
  );
}
