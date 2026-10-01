import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Badge,
  Card,
  Empty,
  FunnelChart,
  PageHeader,
  Stat,
  StatGrid,
  Table,
  Td,
  Th,
  toneForStatus,
} from "@/components/ui";
import { fmtDateTime, pct, relative } from "@/lib/fmt";
import { getSession } from "@/lib/auth";
import { getFunnel } from "@/lib/metrics";
import { collections } from "@/lib/mongodb";
import { listLeads } from "@/lib/queries";
import { STAGE_LABELS } from "@/lib/types";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";
export const metadata = { title: "My dashboard — GruhaFlow" };

export default async function AgentDashboard() {
  const session = await getSession();
  if (!session) redirect("/login?next=/agent");

  const agentId = new ObjectId(session.uid);
  const callsCol = await collections.calls();
  const visitsCol = await collections.visits();
  const leadsCol = await collections.leads();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [funnel, callsToday, dueFollowUps, upcomingVisits, freshLeads, staleLeads] =
    await Promise.all([
      getFunnel({ agentId: session.uid }),
      callsCol.countDocuments({ agentId, createdAt: { $gte: todayStart } }),
      callsCol
        .find({ agentId, nextFollowUpAt: { $lte: new Date() } })
        .sort({ nextFollowUpAt: 1 })
        .limit(25)
        .toArray(),
      visitsCol
        .find({ agentId, status: "SCHEDULED", scheduledAt: { $gte: todayStart } })
        .sort({ scheduledAt: 1 })
        .limit(10)
        .toArray(),
      listLeads({ agentId: session.uid, stage: "NEW", perPage: 10 }),
      // Worked at least once but untouched for a week — the real leak.
      leadsCol
        .find({
          assignedAgentId: agentId,
          stage: { $in: ["CALLED", "INTERESTED", "SITE_VISIT_SCHEDULED", "NEGOTIATION"] },
          updatedAt: { $lt: new Date(Date.now() - 7 * 86400000) },
        })
        .sort({ updatedAt: 1 })
        .limit(10)
        .toArray(),
    ]);

  const followUpLeadIds = dueFollowUps.map((c) => c.leadId);
  const followUpLeads = followUpLeadIds.length
    ? await leadsCol.find({ _id: { $in: followUpLeadIds } }).toArray()
    : [];
  const followUpMap = new Map(followUpLeads.map((l) => [String(l._id), l]));
  const visitLeads = upcomingVisits.length
    ? await leadsCol.find({ _id: { $in: upcomingVisits.map((v) => v.leadId) } }).toArray()
    : [];
  const visitLeadMap = new Map(visitLeads.map((l) => [String(l._id), l]));

  return (
    <div>
      <PageHeader
        title={`Good to see you, ${session.name.split(" ")[0]}`}
        subtitle="Your pipeline, your numbers. Work the three lists below top to bottom."
        action={
          <Link
            href="/agent/leads"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            Open my call list
          </Link>
        }
      />

      <StatGrid cols={5}>
        <Stat label="My leads" value={funnel.totalLeads} />
        <Stat label="Calls today" value={callsToday} tone="brand" hint={`${funnel.totalCalls} all time`} />
        <Stat
          label="Interested"
          value={funnel.interested}
          hint={`${pct(funnel.interested, funnel.called)} of called`}
        />
        <Stat label="Visited site" value={funnel.visited} tone="warn" />
        <Stat
          label="Booked"
          value={funnel.booked}
          tone="good"
          hint={`${pct(funnel.booked, funnel.totalLeads)} of my leads`}
        />
      </StatGrid>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card title="My funnel" subtitle="Only the leads assigned to you.">
          <FunnelChart steps={funnel.steps} />
        </Card>

        <div className="space-y-5">
          <Card
            title={`Follow-ups due (${dueFollowUps.length})`}
            subtitle="You promised to call these back."
          >
            {dueFollowUps.length === 0 ? (
              <Empty>Nothing pending. Nice.</Empty>
            ) : (
              <ul className="space-y-2.5">
                {dueFollowUps.slice(0, 8).map((call) => {
                  const lead = followUpMap.get(String(call.leadId));
                  if (!lead) return null;
                  return (
                    <li key={String(call._id)} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/agent/leads/${String(lead._id)}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {lead.name}
                        </Link>
                        <p className="dim text-xs">
                          {lead.phone} · due {relative(call.nextFollowUpAt)}
                        </p>
                      </div>
                      <Badge tone="warn">{STAGE_LABELS[lead.stage]}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card
            title={`Upcoming site visits (${upcomingVisits.length})`}
            subtitle="Confirm the day before, then mark attended."
          >
            {upcomingVisits.length === 0 ? (
              <Empty>No visits booked.</Empty>
            ) : (
              <ul className="space-y-2.5">
                {upcomingVisits.map((v) => {
                  const lead = visitLeadMap.get(String(v.leadId));
                  return (
                    <li key={String(v._id)} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/agent/leads/${String(v.leadId)}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {lead?.name ?? "Lead"}
                        </Link>
                        <p className="dim text-xs">{fmtDateTime(v.scheduledAt)}</p>
                      </div>
                      <Badge tone="info">Scheduled</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card
          title={`Never called yet (${freshLeads.total})`}
          subtitle="Fresh leads waiting for a first dial."
          action={
            <Link href="/agent/leads?stage=NEW" className="text-brand-600 dark:text-brand-300 text-sm hover:underline">
              See all →
            </Link>
          }
        >
          {freshLeads.rows.length === 0 ? (
            <Empty>No new leads assigned to you.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Lead</Th>
                  <Th>Project</Th>
                  <Th align="right">Budget</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {freshLeads.rows.map((l) => (
                  <tr key={l.id}>
                    <Td>
                      <p className="font-medium">{l.name}</p>
                      <p className="dim text-xs">{l.phone}</p>
                    </Td>
                    <Td className="dim text-xs">{l.projectName}</Td>
                    <Td align="right" className="whitespace-nowrap tabular-nums">{l.budget}</Td>
                    <Td align="right">
                      <Link
                        href={`/agent/leads/${l.id}`}
                        className="text-brand-600 dark:text-brand-300 text-sm whitespace-nowrap hover:underline"
                      >
                        Call →
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card
          title={`Going cold (${staleLeads.length})`}
          subtitle="Worked once, then untouched for over a week."
        >
          {staleLeads.length === 0 ? (
            <Empty>Nothing is going cold.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Lead</Th>
                  <Th>Stage</Th>
                  <Th>Last touched</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {staleLeads.map((l) => (
                  <tr key={String(l._id)}>
                    <Td>
                      <p className="font-medium">{l.name}</p>
                      <p className="dim text-xs">{l.phone}</p>
                    </Td>
                    <Td>
                      <Badge tone={toneForStatus(l.stage)}>{STAGE_LABELS[l.stage]}</Badge>
                    </Td>
                    <Td className="dim whitespace-nowrap text-xs">{relative(l.updatedAt)}</Td>
                    <Td align="right">
                      <Link
                        href={`/agent/leads/${String(l._id)}`}
                        className="text-brand-600 dark:text-brand-300 text-sm whitespace-nowrap hover:underline"
                      >
                        Revive →
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
