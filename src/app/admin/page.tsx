import Link from "next/link";
import {
  Badge,
  BarChart,
  Card,
  Empty,
  FunnelChart,
  PageHeader,
  Stat,
  StatGrid,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { inr, pct } from "@/lib/fmt";
import {
  getAgentLeaderboard,
  getCallTrend,
  getFunnel,
  getOpsSummary,
  getSourcePerformance,
} from "@/lib/metrics";
import { humanize } from "@/lib/fmt";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — GruhaFlow" };

export default async function AdminDashboard() {
  const [funnel, agents, sources, ops, trend] = await Promise.all([
    getFunnel(),
    getAgentLeaderboard(),
    getSourcePerformance(),
    getOpsSummary(),
    getCallTrend(14),
  ]);

  return (
    <div>
      <PageHeader
        title="Sales & operations dashboard"
        subtitle="The whole business on one screen — the calling funnel on top, the post-sales commitments below."
      />

      {/* The four numbers the business asked for, in order. */}
      <StatGrid cols={5}>
        <Stat
          label="Total leads"
          value={funnel.totalLeads.toLocaleString("en-IN")}
          hint={`${funnel.totalCalls.toLocaleString("en-IN")} calls logged`}
        />
        <Stat
          label="Members called"
          value={funnel.called.toLocaleString("en-IN")}
          hint={`${pct(funnel.called, funnel.totalLeads)} of all leads`}
          tone="brand"
        />
        <Stat
          label="Members interested"
          value={funnel.interested.toLocaleString("en-IN")}
          hint={`${pct(funnel.interested, funnel.called)} of those called`}
          tone="brand"
        />
        <Stat
          label="Really visited site"
          value={funnel.visited.toLocaleString("en-IN")}
          hint={`${pct(funnel.visited, funnel.interested)} of interested`}
          tone="warn"
        />
        <Stat
          label="Really bought"
          value={funnel.booked.toLocaleString("en-IN")}
          hint={`${pct(funnel.booked, funnel.visited)} of those who visited`}
          tone="good"
        />
      </StatGrid>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Conversion funnel"
          subtitle="Each bar is measured against the top of the funnel; the percentage is against the step above it."
        >
          <FunnelChart steps={funnel.steps} />
          <div className="mt-5 grid gap-3 border-t hairline pt-4 sm:grid-cols-3">
            <div>
              <p className="dim text-xs uppercase tracking-wide">Booked value</p>
              <p className="mt-0.5 text-lg font-semibold">{inr(funnel.revenue)}</p>
            </div>
            <div>
              <p className="dim text-xs uppercase tracking-wide">Calls per booking</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{funnel.avgCallsPerBooking}</p>
            </div>
            <div>
              <p className="dim text-xs uppercase tracking-wide">Call connect rate</p>
              <p className="mt-0.5 text-lg font-semibold">
                {pct(funnel.connectedCalls, funnel.totalCalls)}
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card title="Where leads fall out" subtitle="Dead-end reasons across the pipeline.">
            <ul className="space-y-2.5 text-sm">
              {[
                ["Not interested", funnel.notInterested, "bad"],
                ["Never reachable", funnel.unreachable, "warn"],
                ["Lost after visit", funnel.lost, "bad"],
              ].map(([label, value, tone]) => (
                <li key={String(label)} className="flex items-center justify-between gap-2">
                  <span>{label as string}</span>
                  <Badge tone={tone as "bad" | "warn"}>{(value as number).toLocaleString("en-IN")}</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Last 14 days of calling" subtitle="Bar height is total dials; the filled part connected.">
            <BarChart data={trend.map((t) => ({ label: t.day, a: t.calls, b: t.connected }))} />
            <p className="dim mt-2 text-xs">
              {trend.reduce((s, t) => s + t.calls, 0).toLocaleString("en-IN")} dials,{" "}
              {trend.reduce((s, t) => s + t.connected, 0).toLocaleString("en-IN")} connected.
            </p>
          </Card>
        </div>
      </div>

      {/* Everything after the sale. */}
      <h2 className="mt-9 mb-3 text-lg font-semibold tracking-tight">After they buy</h2>
      <StatGrid cols={5}>
        <Stat label="Active handovers" value={ops.activeBookings} hint="Booked, not yet handed over" />
        <Stat label="Keys handed over" value={ops.handedOver} tone="good" hint={`${ops.gruhaPraveshamDone} Gruha Pravesham done`} />
        <Stat
          label="Overdue milestones"
          value={ops.stepsOverdue}
          tone={ops.stepsOverdue ? "bad" : "good"}
          hint="Past their due date"
        />
        <Stat
          label="Open service tickets"
          value={ops.openTickets}
          tone={ops.slaBreached ? "warn" : "neutral"}
          hint={`${ops.slaBreached} past SLA`}
        />
        <Stat
          label="Maintenance dues"
          value={inr(ops.duesOutstanding)}
          tone={ops.invoicesOverdue ? "bad" : "neutral"}
          hint={`${ops.invoicesOverdue} invoices overdue`}
        />
      </StatGrid>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card
          title="Agent leaderboard"
          subtitle="Dials are easy; bookings are not."
          action={
            <Link href="/admin/leads" className="text-brand-600 dark:text-brand-300 text-sm hover:underline">
              View leads →
            </Link>
          }
        >
          {agents.length === 0 ? (
            <Empty>No agents yet.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Agent</Th>
                  <Th align="right">Leads</Th>
                  <Th align="right">Calls</Th>
                  <Th align="right">Visited</Th>
                  <Th align="right">Booked</Th>
                  <Th align="right">Conv.</Th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.agentId}>
                    <Td>{a.name}</Td>
                    <Td align="right" className="tabular-nums">{a.leads}</Td>
                    <Td align="right" className="tabular-nums">{a.calls}</Td>
                    <Td align="right" className="tabular-nums">{a.visited}</Td>
                    <Td align="right" className="tabular-nums font-semibold">{a.booked}</Td>
                    <Td align="right" className="tabular-nums">{a.conversion.toFixed(1)}%</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card title="Lead source performance" subtitle="Which channels actually produce buyers.">
          {sources.length === 0 ? (
            <Empty>No leads yet.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Source</Th>
                  <Th align="right">Leads</Th>
                  <Th align="right">Booked</Th>
                  <Th align="right">Conversion</Th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.source}>
                    <Td>{humanize(s.source)}</Td>
                    <Td align="right" className="tabular-nums">{s.leads}</Td>
                    <Td align="right" className="tabular-nums">{s.booked}</Td>
                    <Td align="right" className="tabular-nums">{s.conversion.toFixed(1)}%</Td>
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
