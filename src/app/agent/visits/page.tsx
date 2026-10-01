import Link from "next/link";
import { ObjectId } from "mongodb";
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
  toneForStatus,
} from "@/components/ui";
import { getSession } from "@/lib/auth";
import { fmtDateTime, humanize, pct } from "@/lib/fmt";
import { collections } from "@/lib/mongodb";
import MarkAttended from "./MarkAttended";

export const dynamic = "force-dynamic";
export const metadata = { title: "My site visits — GruhaFlow" };

export default async function AgentVisitsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/agent/visits");

  const visitsCol = await collections.visits();
  const leadsCol = await collections.leads();
  const projectsCol = await collections.projects();

  const visits = await visitsCol
    .find({ agentId: new ObjectId(session.uid) })
    .sort({ scheduledAt: -1 })
    .limit(200)
    .toArray();

  const [leads, projects] = await Promise.all([
    visits.length ? leadsCol.find({ _id: { $in: visits.map((v) => v.leadId) } }).toArray() : [],
    projectsCol.find({}).toArray(),
  ]);
  const leadMap = new Map(leads.map((l) => [String(l._id), l]));
  const projectMap = new Map(projects.map((p) => [String(p._id), p.name]));

  const completed = visits.filter((v) => v.status === "COMPLETED");
  const pending = visits.filter((v) => v.status === "SCHEDULED");
  const noShow = visits.filter((v) => v.status === "NO_SHOW");

  return (
    <div>
      <PageHeader
        title="My site visits"
        subtitle="Mark a visit attended the moment the family walks in — that is the number your manager watches."
      />

      <StatGrid cols={3}>
        <Stat label="Booked by me" value={visits.length} hint={`${pending.length} still to happen`} />
        <Stat
          label="Attended"
          value={completed.length}
          tone="good"
          hint={`${pct(completed.length, visits.length)} turn-up rate`}
        />
        <Stat label="No-shows" value={noShow.length} tone={noShow.length ? "bad" : "good"} />
      </StatGrid>

      <Card className="mt-5" title="All my visits">
        {visits.length === 0 ? (
          <Empty>
            You have not booked a site visit yet. Log a call and tick "Book a site visit".
          </Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Lead</Th>
                <Th>Project</Th>
                <Th>Slot</Th>
                <Th>Status</Th>
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
                      <Link
                        href={`/agent/leads/${String(v.leadId)}`}
                        className="font-medium hover:underline"
                      >
                        {lead?.name ?? "Lead"}
                      </Link>
                      <p className="dim text-xs">{lead?.phone ?? ""}</p>
                    </Td>
                    <Td className="whitespace-nowrap text-sm">
                      {v.projectId ? (projectMap.get(String(v.projectId)) ?? "—") : "—"}
                    </Td>
                    <Td className="whitespace-nowrap text-xs">{fmtDateTime(v.scheduledAt)}</Td>
                    <Td>
                      <Badge tone={toneForStatus(v.status)}>{humanize(v.status)}</Badge>
                    </Td>
                    <Td className="dim max-w-[240px] text-xs">{v.feedback ?? "—"}</Td>
                    <Td align="right">
                      {v.status === "SCHEDULED" ? (
                        <MarkAttended id={String(v._id)} />
                      ) : (
                        <span className="dim text-xs">—</span>
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
