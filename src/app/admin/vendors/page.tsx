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
import { collections } from "@/lib/mongodb";
import { CATEGORY_LABELS, SLA_HOURS } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendors — The Urban Firm" };

export default async function VendorsPage() {
  const vendorsCol = await collections.vendors();
  const ticketsCol = await collections.tickets();

  const vendors = await vendorsCol.find({}).sort({ category: 1, name: 1 }).toArray();

  const loads = await ticketsCol
    .aggregate<{ _id: unknown; open: number; resolved: number; total: number }>([
      { $match: { vendorId: { $ne: null } } },
      {
        $group: {
          _id: "$vendorId",
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, 0, 1] } },
          resolved: { $sum: { $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, 1, 0] } },
        },
      },
    ])
    .toArray();

  const loadMap = new Map(loads.map((l) => [String(l._id), l]));
  const totalOpen = loads.reduce((s, l) => s + l.open, 0);
  const busiest = [...loads].sort((a, b) => b.open - a.open)[0];
  const busiestVendor = busiest
    ? vendors.find((v) => String(v._id) === String(busiest._id))?.name
    : undefined;

  return (
    <div>
      <PageHeader
        title="Vendors"
        subtitle="The trades behind every maintenance category, and how much work each is carrying."
      />

      <StatGrid cols={4}>
        <Stat label="Vendors on panel" value={vendors.length} hint={`${vendors.filter((v) => v.active).length} active`} />
        <Stat label="Categories covered" value={new Set(vendors.map((v) => v.category)).size} />
        <Stat label="Open jobs" value={totalOpen} tone={totalOpen ? "warn" : "good"} />
        <Stat
          label="Busiest vendor"
          value={busiest?.open ?? 0}
          hint={busiestVendor ?? "Nobody assigned yet"}
        />
      </StatGrid>

      <Card className="mt-5" title="Panel" subtitle="Response windows come from the ticket priority, not the vendor.">
        {vendors.length === 0 ? (
          <Empty>No vendors on the panel yet.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Vendor</Th>
                <Th>Category</Th>
                <Th>Phone</Th>
                <Th align="right">Rating</Th>
                <Th align="right">Open jobs</Th>
                <Th align="right">Resolved</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => {
                const load = loadMap.get(String(v._id));
                return (
                  <tr key={String(v._id)}>
                    <Td className="font-medium">{v.name}</Td>
                    <Td className="whitespace-nowrap">{CATEGORY_LABELS[v.category]}</Td>
                    <Td className="dim whitespace-nowrap text-xs">{v.phone}</Td>
                    <Td align="right" className="tabular-nums">★ {v.rating.toFixed(1)}</Td>
                    <Td align="right" className="tabular-nums">{load?.open ?? 0}</Td>
                    <Td align="right" className="tabular-nums">{load?.resolved ?? 0}</Td>
                    <Td>
                      <Badge tone={v.active ? "good" : "muted"}>
                        {v.active ? "Active" : "Inactive"}
                      </Badge>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Card className="mt-5" title="Response windows" subtitle="Applied to every ticket at the moment it is raised.">
        <div className="grid gap-3 sm:grid-cols-4">
          {Object.entries(SLA_HOURS).map(([priority, hours]) => (
            <div key={priority} className="surface-2 rounded-lg px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide">{priority}</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{hours}h</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
