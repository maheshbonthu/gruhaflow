import Link from "next/link";
import { notFound } from "next/navigation";
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
import { duration, fmtDateTime, humanize, inr, relative } from "@/lib/fmt";
import { getLeadDetail } from "@/lib/queries";
import { LEAD_STAGES, STAGE_LABELS, stageIndex } from "@/lib/types";
import LeadActions from "./LeadActions";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getLeadDetail(id);
  if (!detail) notFound();

  const { lead, calls, visits, booking, availableUnits } = detail;
  const current = stageIndex(lead.stage);

  return (
    <div>
      <Link href="/admin/leads" className="dim text-sm hover:underline">
        ← All leads
      </Link>

      <PageHeader
        title={lead.name}
        subtitle={`${lead.phone}${lead.email ? ` · ${lead.email}` : ""} · ${humanize(lead.source)}`}
        action={<Badge tone={toneForStatus(lead.stage)}>{STAGE_LABELS[lead.stage]}</Badge>}
      />

      {/* Where this lead sits in the funnel, at a glance. */}
      <Card className="mb-5" title="Funnel position">
        <ol className="scroll-x flex gap-1.5">
          {LEAD_STAGES.map((stage, i) => {
            const reached = current >= i && current >= 0;
            return (
              <li key={stage} className="flex-1 min-w-[88px]">
                <div
                  className={[
                    "h-1.5 rounded-full",
                    reached ? "bg-brand-500" : "surface-2",
                  ].join(" ")}
                />
                <p className={["mt-1.5 text-xs", reached ? "" : "dim"].join(" ")}>
                  {STAGE_LABELS[stage]}
                </p>
              </li>
            );
          })}
        </ol>
        {current < 0 && (
          <p className="dim mt-3 text-xs">
            This lead is parked outside the forward funnel as{" "}
            <strong>{STAGE_LABELS[lead.stage]}</strong>.
          </p>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title={`Call history (${calls.length})`} subtitle="Newest first.">
            {calls.length === 0 ? (
              <Empty>No calls logged yet. Log the first one from the panel on the right.</Empty>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>When</Th>
                    <Th>Agent</Th>
                    <Th>Outcome</Th>
                    <Th>Disposition</Th>
                    <Th align="right">Duration</Th>
                    <Th>Notes</Th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
                    <tr key={String(call._id)}>
                      <Td className="whitespace-nowrap text-xs">{fmtDateTime(call.createdAt)}</Td>
                      <Td className="whitespace-nowrap">{call.agentName}</Td>
                      <Td>
                        <Badge tone={call.outcome === "CONNECTED" ? "good" : "muted"}>
                          {humanize(call.outcome)}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge tone={toneForStatus(call.disposition)}>
                          {humanize(call.disposition)}
                        </Badge>
                      </Td>
                      <Td align="right" className="tabular-nums">{duration(call.durationSec)}</Td>
                      <Td className="dim max-w-[240px] text-xs">{call.notes ?? "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <Card
            title={`Site visits (${visits.length})`}
            subtitle="Scheduling a visit is not the same as attending one — only a completed visit counts."
          >
            {visits.length === 0 ? (
              <Empty>No site visits yet.</Empty>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Scheduled</Th>
                    <Th>Status</Th>
                    <Th>Attended</Th>
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
                      <Td className="whitespace-nowrap text-xs">
                        {v.visitedAt ? fmtDateTime(v.visitedAt) : "—"}
                      </Td>
                      <Td align="right" className="tabular-nums">{v.rating ?? "—"}</Td>
                      <Td className="dim max-w-[240px] text-xs">{v.feedback ?? "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          {lead.notes && (
            <Card title="Notes">
              <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card title="Lead details">
            <dl className="space-y-2.5 text-sm">
              {[
                ["Assigned agent", detail.agentName],
                ["Project", detail.projectName],
                ["Budget", lead.budgetMin || lead.budgetMax
                  ? `${inr(lead.budgetMin ?? 0)} – ${inr(lead.budgetMax ?? 0)}`
                  : "Not captured"],
                ["Total calls", String(lead.callCount)],
                ["Last call", relative(lead.lastCallAt)],
                ["Created", relative(lead.createdAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="dim">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {booking ? (
            <Card title="Booked" subtitle={`Unit ${booking.unitNo}`}>
              <p className="text-2xl font-semibold">{inr(booking.totalAmount)}</p>
              <p className="dim mt-1 text-sm">Booking {booking.code}</p>
              <Link
                href={`/admin/handover/${booking.id}`}
                className="text-brand-600 dark:text-brand-300 mt-3 inline-block text-sm hover:underline"
              >
                Open handover tracker →
              </Link>
            </Card>
          ) : null}

          <LeadActions
            leadId={String(lead._id)}
            stage={lead.stage}
            hasBooking={Boolean(booking)}
            units={availableUnits}
            visits={visits.filter((v) => v.status === "SCHEDULED").map((v) => ({
              id: v.id,
              scheduledAt: v.scheduledAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
