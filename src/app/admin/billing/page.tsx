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
import { fmtDate, inrExact, pct } from "@/lib/fmt";
import { collections } from "@/lib/mongodb";
import InvoiceActions from "./InvoiceActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Maintenance billing — GruhaFlow" };

export default async function BillingPage() {
  const invoicesCol = await collections.invoices();
  const users = await collections.users();
  const units = await collections.units();
  const projects = await collections.projects();

  const invoices = await invoicesCol.find({}).sort({ dueAt: -1 }).limit(400).toArray();

  const [userDocs, unitDocs, projectDocs] = await Promise.all([
    users.find({ role: "CUSTOMER" }).toArray(),
    units.find({}).toArray(),
    projects.find({}).toArray(),
  ]);

  const userMap = new Map(userDocs.map((u) => [String(u._id), u]));
  const unitMap = new Map(unitDocs.map((u) => [String(u._id), u]));
  const projectMap = new Map(projectDocs.map((p) => [String(p._id), p.name]));

  const now = Date.now();
  const billed = invoices.reduce((s, i) => s + i.amount, 0);
  const collected = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status !== "PAID" && i.dueAt.getTime() < now);
  const outstanding = invoices.filter((i) => i.status !== "PAID").reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <PageHeader
        title="Maintenance billing"
        subtitle="Monthly common-area maintenance, water, security and corpus charges per flat."
      />

      <StatGrid cols={4}>
        <Stat label="Total billed" value={inrExact(billed)} hint={`${invoices.length} invoices`} />
        <Stat
          label="Collected"
          value={inrExact(collected)}
          tone="good"
          hint={`${pct(collected, billed)} collection rate`}
        />
        <Stat label="Outstanding" value={inrExact(outstanding)} tone={outstanding ? "warn" : "good"} />
        <Stat
          label="Overdue invoices"
          value={overdue.length}
          tone={overdue.length ? "bad" : "good"}
          hint={inrExact(overdue.reduce((s, i) => s + i.amount, 0))}
        />
      </StatGrid>

      <Card className="mt-5" title={`${invoices.length} invoices`} subtitle="Newest billing period first.">
        {invoices.length === 0 ? (
          <Empty>No invoices raised yet. They are generated once a flat is handed over.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Period</Th>
                <Th>Resident</Th>
                <Th>Flat</Th>
                <Th>Breakdown</Th>
                <Th align="right">Amount</Th>
                <Th>Due</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const resident = userMap.get(String(inv.customerId));
                const unit = unitMap.get(String(inv.unitId));
                const isOverdue = inv.status !== "PAID" && inv.dueAt.getTime() < now;
                return (
                  <tr key={String(inv._id)}>
                    <Td className="whitespace-nowrap font-medium">{inv.period}</Td>
                    <Td className="whitespace-nowrap">
                      <p>{resident?.name ?? "—"}</p>
                      <p className="dim text-xs">{resident?.email ?? ""}</p>
                    </Td>
                    <Td className="dim whitespace-nowrap text-xs">
                      {unit ? `${projectMap.get(String(unit.projectId)) ?? ""} · ${unit.unitNo}` : "—"}
                    </Td>
                    <Td className="dim max-w-[240px] text-xs">
                      {inv.lines.map((l) => `${l.label} ${inrExact(l.amount)}`).join(" · ")}
                    </Td>
                    <Td align="right" className="whitespace-nowrap tabular-nums font-semibold">
                      {inrExact(inv.amount)}
                    </Td>
                    <Td className="whitespace-nowrap text-xs">{fmtDate(inv.dueAt)}</Td>
                    <Td>
                      <Badge tone={inv.status === "PAID" ? "good" : isOverdue ? "bad" : "warn"}>
                        {inv.status === "PAID" ? "Paid" : isOverdue ? "Overdue" : "Due"}
                      </Badge>
                      {inv.paidAt && <p className="dim mt-0.5 text-xs">{fmtDate(inv.paidAt)}</p>}
                    </Td>
                    <Td align="right">
                      <InvoiceActions id={String(inv._id)} paid={inv.status === "PAID"} />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
