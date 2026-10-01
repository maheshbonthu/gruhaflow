import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Badge,
  Card,
  Empty,
  PageHeader,
  Table,
  Td,
  Th,
  toneForStatus,
} from "@/components/ui";
import LeadActions from "@/app/admin/leads/[id]/LeadActions";
import { getSession } from "@/lib/auth";
import { duration, fmtDateTime, humanize, inr, relative } from "@/lib/fmt";
import { getLeadDetail } from "@/lib/queries";
import { LEAD_STAGES, STAGE_LABELS, stageIndex } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AgentLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/agent/leads");

  const { id } = await params;
  const detail = await getLeadDetail(id);
  if (!detail) notFound();

  const { lead, calls, visits, booking, availableUnits } = detail;

  // An agent only ever works their own leads; a manager can see any of them.
  if (session.role === "AGENT" && lead.assignedAgentId && String(lead.assignedAgentId) !== session.uid) {
    return (
      <div>
        <Link href="/agent/leads" className="dim text-sm hover:underline">
          ← My call list
        </Link>
        <Card className="mt-5" title="Not your lead">
          <p className="text-sm">
            This lead is assigned to someone else. Ask your manager to reassign it if you need to
            work it.
          </p>
        </Card>
      </div>
    );
  }

  const current = stageIndex(lead.stage);

  return (
    <div>
      <Link href="/agent/leads" className="dim text-sm hover:underline">
        ← My call list
      </Link>

      <PageHeader
        title={lead.name}
        subtitle={`${humanize(lead.source)} · ${detail.projectName}`}
        action={
          <div className="flex items-center gap-2">
            <a
              href={`tel:${lead.phone}`}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              Call {lead.phone}
            </a>
            <Badge tone={toneForStatus(lead.stage)}>{STAGE_LABELS[lead.stage]}</Badge>
          </div>
        }
      />

      <Card className="mb-5" title="Funnel position">
        <ol className="scroll-x flex gap-1.5">
          {LEAD_STAGES.map((stage, i) => {
            const reached = current >= i && current >= 0;
            return (
              <li key={stage} className="flex-1 min-w-[88px]">
                <div className={["h-1.5 rounded-full", reached ? "bg-brand-500" : "surface-2"].join(" ")} />
                <p className={["mt-1.5 text-xs", reached ? "" : "dim"].join(" ")}>
                  {STAGE_LABELS[stage]}
                </p>
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="Before you dial">
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ["Phone", lead.phone],
                ["Email", lead.email ?? "Not captured"],
                [
                  "Budget",
                  lead.budgetMin || lead.budgetMax
                    ? `${inr(lead.budgetMin ?? 0)} – ${inr(lead.budgetMax ?? 0)}`
                    : "Not captured",
                ],
                ["Times called", String(lead.callCount)],
                ["Last call", relative(lead.lastCallAt)],
                ["Lead age", relative(lead.createdAt)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="dim text-xs uppercase tracking-wide">{k}</dt>
                  <dd className="mt-0.5 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {lead.notes && (
              <div className="mt-4 border-t hairline pt-3">
                <p className="dim text-xs uppercase tracking-wide">Notes</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}
          </Card>

          <Card title={`Call history (${calls.length})`}>
            {calls.length === 0 ? (
              <Empty>No calls yet — you are first.</Empty>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>When</Th>
                    <Th>Outcome</Th>
                    <Th>Disposition</Th>
                    <Th align="right">Length</Th>
                    <Th>Notes</Th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
                    <tr key={String(call._id)}>
                      <Td className="whitespace-nowrap text-xs">{fmtDateTime(call.createdAt)}</Td>
                      <Td>
                        <Badge tone={call.outcome === "CONNECTED" ? "good" : "muted"}>
                          {humanize(call.outcome)}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge tone={toneForStatus(call.disposition)}>{humanize(call.disposition)}</Badge>
                      </Td>
                      <Td align="right" className="tabular-nums">{duration(call.durationSec)}</Td>
                      <Td className="dim max-w-[240px] text-xs">{call.notes ?? "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          {visits.length > 0 && (
            <Card title="Site visits">
              <Table>
                <thead>
                  <tr>
                    <Th>Slot</Th>
                    <Th>Status</Th>
                    <Th align="right">Rating</Th>
                    <Th>Feedback</Th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((v) => (
                    <tr key={v.id}>
                      <Td className="whitespace-nowrap text-xs">{fmtDateTime(v.scheduledAt)}</Td>
                      <Td>
                        <Badge tone={toneForStatus(v.status)}>{humanize(v.status)}</Badge>
                      </Td>
                      <Td align="right" className="tabular-nums">{v.rating ?? "—"}</Td>
                      <Td className="dim max-w-[240px] text-xs">{v.feedback ?? "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}
        </div>

        <div>
          {booking && (
            <Card className="mb-5" title="Already booked" subtitle={`Unit ${booking.unitNo}`}>
              <p className="text-2xl font-semibold">{inr(booking.totalAmount)}</p>
              <p className="dim mt-1 text-sm">Booking {booking.code}</p>
            </Card>
          )}

          <LeadActions
            leadId={String(lead._id)}
            stage={lead.stage}
            hasBooking={Boolean(booking)}
            units={availableUnits}
            visits={visits
              .filter((v) => v.status === "SCHEDULED")
              .map((v) => ({ id: v.id, scheduledAt: v.scheduledAt.toISOString() }))}
          />
        </div>
      </div>
    </div>
  );
}
