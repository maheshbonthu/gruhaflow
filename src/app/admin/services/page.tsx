import {
  Card,
  Empty,
  PageHeader,
  Stat,
  StatGrid,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { collections } from "@/lib/mongodb";
import { listTickets } from "@/lib/queries";
import { CATEGORY_LABELS, SERVICE_CATEGORIES } from "@/lib/types";
import ServiceFilters from "./ServiceFilters";
import TicketRowActions from "./TicketRowActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Service desk — GruhaFlow" };

export default async function ServiceDeskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;

  const vendorsCol = await collections.vendors();
  const ticketsCol = await collections.tickets();

  const [tickets, vendors, byCategory] = await Promise.all([
    listTickets({
      status: sp.status ?? "OPEN_ONLY",
      category: sp.category,
      priority: sp.priority,
    }),
    vendorsCol.find({ active: true }).sort({ name: 1 }).toArray(),
    ticketsCol
      .aggregate<{ _id: string; open: number; total: number }>([
        {
          $group: {
            _id: "$category",
            total: { $sum: 1 },
            open: {
              $sum: { $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, 0, 1] },
            },
          },
        },
        { $sort: { open: -1 } },
      ])
      .toArray(),
  ]);

  const open = tickets.filter((t) => !["RESOLVED", "CLOSED"].includes(t.status));
  const breached = tickets.filter((t) => t.breached);
  const unassigned = open.filter((t) => !t.vendorName);
  const emergency = open.filter((t) => t.priority === "EMERGENCY");

  const vendorOptions = vendors.map((v) => ({
    id: String(v._id),
    name: v.name,
    category: v.category,
  }));

  return (
    <div>
      <PageHeader
        title="Service desk"
        subtitle="Electricity, plumbing, interiors, security, housekeeping — every resident request with an SLA clock on it."
      />

      <StatGrid cols={4}>
        <Stat label="Open tickets" value={open.length} hint="In the current filter" />
        <Stat
          label="Past SLA"
          value={breached.length}
          tone={breached.length ? "bad" : "good"}
          hint="Breached their response window"
        />
        <Stat
          label="Unassigned"
          value={unassigned.length}
          tone={unassigned.length ? "warn" : "good"}
          hint="No vendor picked up yet"
        />
        <Stat
          label="Emergencies"
          value={emergency.length}
          tone={emergency.length ? "bad" : "good"}
          hint="2-hour response window"
        />
      </StatGrid>

      <Card className="mt-5" title="Load by category">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {byCategory.map((c) => (
            <div key={c._id} className="surface-2 rounded-lg px-3 py-2">
              <p className="text-xs font-medium">
                {CATEGORY_LABELS[c._id as keyof typeof CATEGORY_LABELS] ?? c._id}
              </p>
              <p className="mt-0.5 text-sm tabular-nums">
                <strong>{c.open}</strong> <span className="dim">open of {c.total}</span>
              </p>
            </div>
          ))}
          {byCategory.length === 0 && <Empty>No tickets yet.</Empty>}
        </div>
      </Card>

      <Card className="mt-5">
        <ServiceFilters categories={SERVICE_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))} />
      </Card>

      <Card className="mt-5" title={`${tickets.length} tickets`}>
        {tickets.length === 0 ? (
          <Empty>No tickets match that filter.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Ticket</Th>
                <Th>Resident</Th>
                <Th>Category</Th>
                <Th>Priority</Th>
                <Th>SLA</Th>
                <Th>Vendor</Th>
                <Th>Status & actions</Th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <TicketRowActions
                  key={t.id}
                  ticket={{
                    id: t.id,
                    code: t.code,
                    title: t.title,
                    customerName: t.customerName,
                    unitNo: t.unitNo,
                    projectName: t.projectName,
                    category: t.category,
                    priority: t.priority,
                    status: t.status,
                    vendorName: t.vendorName,
                    slaDueAt: t.slaDueAt.toISOString(),
                    createdAt: t.createdAt.toISOString(),
                    breached: t.breached,
                  }}
                  vendors={vendorOptions}
                />
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
