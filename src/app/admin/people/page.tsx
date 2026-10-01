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
import { fmtDate, inr } from "@/lib/fmt";
import { collections } from "@/lib/mongodb";
import { getAgentLeaderboard } from "@/lib/metrics";
import { ROLE_LABEL } from "@/components/nav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team & residents — GruhaFlow" };

export default async function PeoplePage() {
  const users = await collections.users();
  const bookingsCol = await collections.bookings();
  const unitsCol = await collections.units();
  const projectsCol = await collections.projects();
  const ticketsCol = await collections.tickets();

  const [staff, customers, leaderboard] = await Promise.all([
    users.find({ role: { $in: ["ADMIN", "MANAGER", "AGENT"] } }).sort({ role: 1, name: 1 }).toArray(),
    users.find({ role: "CUSTOMER" }).sort({ createdAt: -1 }).toArray(),
    getAgentLeaderboard(),
  ]);

  const [bookings, units, projects, ticketCounts] = await Promise.all([
    bookingsCol.find({}).toArray(),
    unitsCol.find({}).toArray(),
    projectsCol.find({}).toArray(),
    ticketsCol
      .aggregate<{ _id: unknown; open: number; total: number }>([
        {
          $group: {
            _id: "$customerId",
            total: { $sum: 1 },
            open: { $sum: { $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, 0, 1] } },
          },
        },
      ])
      .toArray(),
  ]);

  const bookingByCustomer = new Map(bookings.map((b) => [String(b.customerId), b]));
  const unitMap = new Map(units.map((u) => [String(u._id), u]));
  const projectMap = new Map(projects.map((p) => [String(p._id), p.name]));
  const ticketMap = new Map(ticketCounts.map((t) => [String(t._id), t]));
  const perfMap = new Map(leaderboard.map((l) => [l.agentId, l]));

  return (
    <div>
      <PageHeader
        title="Team & residents"
        subtitle="Who works the phones, and who lives in the buildings."
      />

      <StatGrid cols={4}>
        <Stat label="Staff accounts" value={staff.length} />
        <Stat label="Tele-call agents" value={staff.filter((s) => s.role === "AGENT").length} />
        <Stat label="Residents with a login" value={customers.length} tone="brand" />
        <Stat
          label="Residents with open tickets"
          value={ticketCounts.filter((t) => t.open > 0).length}
          tone="warn"
        />
      </StatGrid>

      <Card className="mt-5" title="Staff" subtitle="Every account that can see the console.">
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th align="right">Leads</Th>
              <Th align="right">Calls</Th>
              <Th align="right">Booked</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => {
              const perf = perfMap.get(String(s._id));
              return (
                <tr key={String(s._id)}>
                  <Td className="font-medium">{s.name}</Td>
                  <Td className="whitespace-nowrap">
                    <Badge tone={s.role === "ADMIN" ? "brand" : s.role === "MANAGER" ? "info" : "neutral"}>
                      {ROLE_LABEL[s.role]}
                    </Badge>
                  </Td>
                  <Td className="dim text-xs">{s.email}</Td>
                  <Td className="dim whitespace-nowrap text-xs">{s.phone}</Td>
                  <Td align="right" className="tabular-nums">{perf?.leads ?? "—"}</Td>
                  <Td align="right" className="tabular-nums">{perf?.calls ?? "—"}</Td>
                  <Td align="right" className="tabular-nums font-semibold">{perf?.booked ?? "—"}</Td>
                  <Td>
                    <Badge tone={s.active ? "good" : "muted"}>{s.active ? "Active" : "Disabled"}</Badge>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      <Card
        className="mt-5"
        title={`Residents (${customers.length})`}
        subtitle="Created automatically when a lead converts. Seeded accounts use the password demo1234 — sign in as any of them to see the buyer portal."
      >
        {customers.length === 0 ? (
          <Empty>No residents yet. They appear as soon as a lead is converted to a booking.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Resident</Th>
                <Th>Email (login)</Th>
                <Th>Phone</Th>
                <Th>Flat</Th>
                <Th align="right">Booking value</Th>
                <Th>Since</Th>
                <Th align="right">Tickets</Th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const booking = bookingByCustomer.get(String(c._id));
                const unit = booking ? unitMap.get(String(booking.unitId)) : undefined;
                const tickets = ticketMap.get(String(c._id));
                return (
                  <tr key={String(c._id)}>
                    <Td className="font-medium">{c.name}</Td>
                    <Td className="text-brand-600 dark:text-brand-300 text-xs">{c.email}</Td>
                    <Td className="dim whitespace-nowrap text-xs">{c.phone}</Td>
                    <Td className="whitespace-nowrap text-xs">
                      {unit
                        ? `${projectMap.get(String(unit.projectId)) ?? ""} · ${unit.unitNo}`
                        : "—"}
                    </Td>
                    <Td align="right" className="whitespace-nowrap tabular-nums">
                      {booking ? inr(booking.totalAmount) : "—"}
                    </Td>
                    <Td className="whitespace-nowrap text-xs">{fmtDate(c.createdAt)}</Td>
                    <Td align="right" className="tabular-nums">
                      {tickets ? (
                        <>
                          <span className={tickets.open ? "font-semibold" : "dim"}>{tickets.open}</span>
                          <span className="dim"> / {tickets.total}</span>
                        </>
                      ) : (
                        "—"
                      )}
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
