import Link from "next/link";
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
  toneForStatus,
} from "@/components/ui";
import { fmtDateTime, humanize, pct } from "@/lib/fmt";
import { collections } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site visits — The Urban Firm" };

export default async function VisitsPage() {
  const visitsCol = await collections.visits();
  const leadsCol = await collections.leads();
  const usersCol = await collections.users();
  const projectsCol = await collections.projects();

  const visits = await visitsCol.find({}).sort({ scheduledAt: -1 }).limit(300).toArray();

  const [leads, staff, projects] = await Promise.all([
    leadsCol.find({ _id: { $in: visits.map((v) => v.leadId) } }).toArray(),
    usersCol.find({ role: { $in: ["AGENT", "MANAGER", "ADMIN"] } }).toArray(),
    projectsCol.find({}).toArray(),
  ]);

  const leadMap = new Map(leads.map((l) => [String(l._id), l]));
  const staffMap = new Map(staff.map((s) => [String(s._id), s.name]));
  const projectMap = new Map(projects.map((p) => [String(p._id), p.name]));

  const completed = visits.filter((v) => v.status === "COMPLETED");
  const scheduled = visits.filter((v) => v.status === "SCHEDULED");
  const noShow = visits.filter((v) => v.status === "NO_SHOW");
  const upcoming = scheduled.filter((v) => v.scheduledAt.getTime() > Date.now());
  const avgRating = completed.filter((v) => v.rating).length
    ? completed.reduce((s, v) => s + (v.rating ?? 0), 0) / completed.filter((v) => v.rating).length
    : 0;

  return (
    <div>
      <PageHeader
        title="Site visits"
        subtitle="Booking a visit is cheap. Turning up is the number that matters."
      />

      <StatGrid cols={4}>
        <Stat label="Visits scheduled" value={visits.length} hint={`${upcoming.length} still upcoming`} />
        <Stat
          label="Actually attended"
          value={completed.length}
          tone="good"
          hint={`${pct(completed.length, visits.length)} turn-up rate`}
        />
        <Stat
          label="No-shows"
          value={noShow.length}
          tone={noShow.length ? "bad" : "good"}
          hint={pct(noShow.length, visits.length)}
        />
        <Stat
          label="Average visit rating"
          value={avgRating ? avgRating.toFixed(1) : "—"}
          tone="brand"
          hint="Out of 5, from attended visits"
        />
      </StatGrid>

      <Card className="mt-5" title="All site visits" subtitle="Newest slot first.">
        {visits.length === 0 ? (
          <Empty>No site visits booked yet.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Lead</Th>
                <Th>Project</Th>
                <Th>Agent</Th>
                <Th>Slot</Th>
                <Th>Status</Th>
                <Th align="right">Rating</Th>
                <Th>Feedback</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {visits.map((v) => {
                const lead = leadMap.get(String(v.leadId));
                return (
                  <tr key={String(v._id)}>
                    <Td>
                      <p className="font-medium">{lead?.name ?? "—"}</p>
                      <p className="dim text-xs">{lead?.phone ?? ""}</p>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {v.projectId ? (projectMap.get(String(v.projectId)) ?? "—") : "—"}
                    </Td>
                    <Td className="whitespace-nowrap">{staffMap.get(String(v.agentId)) ?? "—"}</Td>
                    <Td className="whitespace-nowrap text-xs">{fmtDateTime(v.scheduledAt)}</Td>
                    <Td>
                      <Badge tone={toneForStatus(v.status)}>{humanize(v.status)}</Badge>
                    </Td>
                    <Td align="right" className="tabular-nums">{v.rating ?? "—"}</Td>
                    <Td className="dim max-w-[260px] text-xs">{v.feedback ?? "—"}</Td>
                    <Td align="right">
                      {lead && (
                        <Link
                          href={`/admin/leads/${String(lead._id)}`}
                          className="text-brand-600 dark:text-brand-300 text-sm whitespace-nowrap hover:underline"
                        >
                          Open lead →
                        </Link>
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
