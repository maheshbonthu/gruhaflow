import { ObjectId, type Filter } from "mongodb";
import { collections } from "./mongodb";
import { LEAD_STAGES, type AnyStage, type CallDoc, type LeadDoc } from "./types";

export interface FunnelStep {
  key: string;
  label: string;
  count: number;
  /** Share of the very top of the funnel. */
  ofTotal: number;
  /** Share of the immediately preceding step — the real conversion rate. */
  ofPrevious: number;
}

export interface FunnelReport {
  totalLeads: number;
  called: number;
  interested: number;
  visitScheduled: number;
  visited: number;
  negotiation: number;
  booked: number;
  notInterested: number;
  unreachable: number;
  lost: number;
  steps: FunnelStep[];
  revenue: number;
  totalCalls: number;
  connectedCalls: number;
  avgCallsPerBooking: number;
}

/**
 * Stages are cumulative: a lead sitting at BOOKED was necessarily called,
 * was interested and did visit. So each headline number counts every lead at
 * or past that stage rather than only the ones parked exactly on it.
 */
function countAtOrPast(byStage: Map<string, number>, target: string): number {
  const from = (LEAD_STAGES as readonly string[]).indexOf(target);
  if (from < 0) return 0;
  let total = 0;
  for (let i = from; i < LEAD_STAGES.length; i++) {
    total += byStage.get(LEAD_STAGES[i]) ?? 0;
  }
  return total;
}

export interface FunnelScope {
  agentId?: string;
  projectId?: string;
  /** Only count leads created on or after this date. */
  since?: Date;
}

function scopeToFilter(scope: FunnelScope): Filter<LeadDoc> {
  const filter: Filter<LeadDoc> = {};
  if (scope.agentId && ObjectId.isValid(scope.agentId)) {
    filter.assignedAgentId = new ObjectId(scope.agentId);
  }
  if (scope.projectId && ObjectId.isValid(scope.projectId)) {
    filter.projectId = new ObjectId(scope.projectId);
  }
  if (scope.since) {
    filter.createdAt = { $gte: scope.since };
  }
  return filter;
}

export async function getFunnel(scope: FunnelScope = {}): Promise<FunnelReport> {
  const leads = await collections.leads();
  const calls = await collections.calls();
  const bookings = await collections.bookings();
  const filter = scopeToFilter(scope);

  const grouped = await leads
    .aggregate<{ _id: AnyStage; n: number }>([
      { $match: filter },
      { $group: { _id: "$stage", n: { $sum: 1 } } },
    ])
    .toArray();

  const byStage = new Map<string, number>();
  for (const row of grouped) byStage.set(String(row._id), row.n);

  // `grouped` already covers the dead stages, so this is the true denominator.
  const totalLeads = grouped.reduce((sum, r) => sum + r.n, 0);
  const called = countAtOrPast(byStage, "CALLED");
  const interested = countAtOrPast(byStage, "INTERESTED");
  const visitScheduled = countAtOrPast(byStage, "SITE_VISIT_SCHEDULED");
  const visited = countAtOrPast(byStage, "SITE_VISITED");
  const negotiation = countAtOrPast(byStage, "NEGOTIATION");
  const booked = byStage.get("BOOKED") ?? 0;

  // A lead that was reached and then said no still counts as "called".
  const notInterested = byStage.get("NOT_INTERESTED") ?? 0;
  const unreachable = byStage.get("UNREACHABLE") ?? 0;
  const lost = byStage.get("LOST") ?? 0;
  const calledIncludingDead = called + notInterested + lost;

  const rows: Array<[string, string, number]> = [
    ["TOTAL", "Total leads", totalLeads],
    ["CALLED", "Called at least once", calledIncludingDead],
    ["INTERESTED", "Showed interest", interested + lost],
    ["SITE_VISIT_SCHEDULED", "Site visit scheduled", visitScheduled + lost],
    ["SITE_VISITED", "Actually visited site", visited],
    ["NEGOTIATION", "In negotiation", negotiation],
    ["BOOKED", "Bought a unit", booked],
  ];

  const top = rows[0][2] || 1;
  const steps: FunnelStep[] = rows.map(([key, label, count], i) => ({
    key,
    label,
    count,
    ofTotal: (count / top) * 100,
    ofPrevious: i === 0 ? 100 : rows[i - 1][2] ? (count / rows[i - 1][2]) * 100 : 0,
  }));

  const callFilter: Filter<CallDoc> = {};
  if (scope.agentId && ObjectId.isValid(scope.agentId)) {
    callFilter.agentId = new ObjectId(scope.agentId);
  }
  if (scope.since) callFilter.createdAt = { $gte: scope.since };

  const [totalCalls, connectedCalls, revenueAgg] = await Promise.all([
    calls.countDocuments(callFilter),
    calls.countDocuments({ ...callFilter, outcome: "CONNECTED" }),
    bookings
      .aggregate<{ total: number }>([
        { $match: { status: { $ne: "CANCELLED" } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ])
      .toArray(),
  ]);

  return {
    totalLeads,
    called: calledIncludingDead,
    interested: interested + lost,
    visitScheduled: visitScheduled + lost,
    visited,
    negotiation,
    booked,
    notInterested,
    unreachable,
    lost,
    steps,
    revenue: revenueAgg[0]?.total ?? 0,
    totalCalls,
    connectedCalls,
    avgCallsPerBooking: booked ? Math.round((totalCalls / booked) * 10) / 10 : 0,
  };
}

export interface AgentRow {
  agentId: string;
  name: string;
  leads: number;
  calls: number;
  connected: number;
  interested: number;
  visited: number;
  booked: number;
  revenue: number;
  conversion: number;
}

/** Per-agent leaderboard: who is actually turning dials into bookings. */
export async function getAgentLeaderboard(): Promise<AgentRow[]> {
  const users = await collections.users();
  const leads = await collections.leads();
  const calls = await collections.calls();
  const bookings = await collections.bookings();

  const agents = await users
    .find({ role: { $in: ["AGENT", "MANAGER"] } })
    .project<{ _id: ObjectId; name: string }>({ name: 1 })
    .toArray();

  const [leadRows, callRows, bookingRows] = await Promise.all([
    leads
      .aggregate<{ _id: ObjectId; stages: AnyStage[] }>([
        { $match: { assignedAgentId: { $ne: null } } },
        { $group: { _id: "$assignedAgentId", stages: { $push: "$stage" } } },
      ])
      .toArray(),
    calls
      .aggregate<{ _id: ObjectId; total: number; connected: number }>([
        {
          $group: {
            _id: "$agentId",
            total: { $sum: 1 },
            connected: {
              $sum: { $cond: [{ $eq: ["$outcome", "CONNECTED"] }, 1, 0] },
            },
          },
        },
      ])
      .toArray(),
    bookings
      .aggregate<{ _id: ObjectId; n: number; revenue: number }>([
        { $match: { status: { $ne: "CANCELLED" } } },
        { $group: { _id: "$agentId", n: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } },
      ])
      .toArray(),
  ]);

  const leadMap = new Map(leadRows.map((r) => [String(r._id), r.stages]));
  const callMap = new Map(callRows.map((r) => [String(r._id), r]));
  const bookMap = new Map(bookingRows.map((r) => [String(r._id), r]));

  const reached = (stages: AnyStage[], target: string) => {
    const from = (LEAD_STAGES as readonly string[]).indexOf(target);
    return stages.filter((s) => {
      const i = (LEAD_STAGES as readonly string[]).indexOf(s);
      return i >= 0 && i >= from;
    }).length;
  };

  return agents
    .map((agent) => {
      const id = String(agent._id);
      const stages = leadMap.get(id) ?? [];
      const call = callMap.get(id);
      const book = bookMap.get(id);
      const booked = book?.n ?? 0;
      return {
        agentId: id,
        name: agent.name,
        leads: stages.length,
        calls: call?.total ?? 0,
        connected: call?.connected ?? 0,
        interested: reached(stages, "INTERESTED"),
        visited: reached(stages, "SITE_VISITED"),
        booked,
        revenue: book?.revenue ?? 0,
        conversion: stages.length ? (booked / stages.length) * 100 : 0,
      };
    })
    .sort((a, b) => b.booked - a.booked || b.visited - a.visited);
}

export interface SourceRow {
  source: string;
  leads: number;
  booked: number;
  conversion: number;
}

export async function getSourcePerformance(): Promise<SourceRow[]> {
  const leads = await collections.leads();
  const rows = await leads
    .aggregate<{ _id: string; leads: number; booked: number }>([
      {
        $group: {
          _id: "$source",
          leads: { $sum: 1 },
          booked: { $sum: { $cond: [{ $eq: ["$stage", "BOOKED"] }, 1, 0] } },
        },
      },
      { $sort: { leads: -1 } },
    ])
    .toArray();
  return rows.map((r) => ({
    source: r._id,
    leads: r.leads,
    booked: r.booked,
    conversion: r.leads ? (r.booked / r.leads) * 100 : 0,
  }));
}

export interface OpsSummary {
  activeBookings: number;
  handedOver: number;
  gruhaPraveshamDone: number;
  stepsOverdue: number;
  openTickets: number;
  slaBreached: number;
  resolvedThisMonth: number;
  duesOutstanding: number;
  invoicesOverdue: number;
}

/** Post-sales health: handover progress plus the maintenance desk. */
export async function getOpsSummary(): Promise<OpsSummary> {
  const bookings = await collections.bookings();
  const journey = await collections.journey();
  const tickets = await collections.tickets();
  const invoices = await collections.invoices();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    activeBookings,
    handedOver,
    gruhaPraveshamDone,
    stepsOverdue,
    openTickets,
    slaBreached,
    resolvedThisMonth,
    dues,
    invoicesOverdue,
  ] = await Promise.all([
    bookings.countDocuments({ status: "ACTIVE" }),
    bookings.countDocuments({ status: "HANDED_OVER" }),
    journey.countDocuments({ key: "GRUHA_PRAVESHAM", status: "DONE" }),
    journey.countDocuments({ status: { $ne: "DONE" }, dueAt: { $lt: now } }),
    tickets.countDocuments({ status: { $nin: ["RESOLVED", "CLOSED"] } }),
    tickets.countDocuments({
      status: { $nin: ["RESOLVED", "CLOSED"] },
      slaDueAt: { $lt: now },
    }),
    tickets.countDocuments({ resolvedAt: { $gte: monthStart } }),
    invoices
      .aggregate<{ total: number }>([
        { $match: { status: { $ne: "PAID" } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray(),
    invoices.countDocuments({ status: { $ne: "PAID" }, dueAt: { $lt: now } }),
  ]);

  return {
    activeBookings,
    handedOver,
    gruhaPraveshamDone,
    stepsOverdue,
    openTickets,
    slaBreached,
    resolvedThisMonth,
    duesOutstanding: dues[0]?.total ?? 0,
    invoicesOverdue,
  };
}

/** Daily call volume for the last `days` days, oldest first. */
export async function getCallTrend(days = 14): Promise<Array<{ day: string; calls: number; connected: number }>> {
  const calls = await collections.calls();
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (days - 1));

  const rows = await calls
    .aggregate<{ _id: string; calls: number; connected: number }>([
      { $match: { createdAt: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          calls: { $sum: 1 },
          connected: { $sum: { $cond: [{ $eq: ["$outcome", "CONNECTED"] }, 1, 0] } },
        },
      },
    ])
    .toArray();

  const map = new Map(rows.map((r) => [r._id, r]));
  const out: Array<{ day: string; calls: number; connected: number }> = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    out.push({
      day: key,
      calls: map.get(key)?.calls ?? 0,
      connected: map.get(key)?.connected ?? 0,
    });
  }
  return out;
}
