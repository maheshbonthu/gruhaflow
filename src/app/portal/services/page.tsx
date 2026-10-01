import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import {
  Badge,
  Card,
  Empty,
  PageHeader,
  Stat,
  StatGrid,
  toneForStatus,
} from "@/components/ui";
import { getSession } from "@/lib/auth";
import { fmtDateTime, humanize, relative } from "@/lib/fmt";
import { collections } from "@/lib/mongodb";
import { CATEGORY_LABELS, SLA_HOURS } from "@/lib/types";
import NewTicketForm from "./NewTicketForm";
import CloseTicket from "./CloseTicket";

export const dynamic = "force-dynamic";
export const metadata = { title: "Service requests — GruhaFlow" };

export default async function PortalServicesPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/portal/services");

  const ticketsCol = await collections.tickets();
  const vendorsCol = await collections.vendors();

  const tickets = await ticketsCol
    .find({ customerId: new ObjectId(session.uid) })
    .sort({ createdAt: -1 })
    .toArray();

  const vendors = await vendorsCol
    .find({ _id: { $in: tickets.map((t) => t.vendorId).filter(Boolean) as ObjectId[] } })
    .toArray();
  const vendorMap = new Map(vendors.map((v) => [String(v._id), v]));

  const now = Date.now();
  const open = tickets.filter((t) => !["RESOLVED", "CLOSED"].includes(t.status));
  const resolved = tickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status));

  return (
    <div>
      <PageHeader
        title="Service requests"
        subtitle="Electricity, plumbing, interiors, security, housekeeping, lifts, water, internet or parking — raise it here and watch it move."
      />

      <StatGrid cols={3}>
        <Stat label="Open requests" value={open.length} tone={open.length ? "warn" : "good"} />
        <Stat label="Resolved" value={resolved.length} tone="good" />
        <Stat label="Raised in total" value={tickets.length} />
      </StatGrid>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-5">
          {open.length > 0 && (
            <Card title={`Open (${open.length})`} subtitle="Still with the facility team.">
              <ul className="space-y-4">
                {open.map((t) => {
                  const vendor = t.vendorId ? vendorMap.get(String(t.vendorId)) : undefined;
                  const breached = t.slaDueAt.getTime() < now;
                  return (
                    <li key={String(t._id)} className="border-b hairline pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium">{t.title}</h3>
                          <p className="dim text-xs">
                            {t.code} · {CATEGORY_LABELS[t.category]} · raised {relative(t.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge tone={toneForStatus(t.status)}>{humanize(t.status)}</Badge>
                          <Badge
                            tone={t.priority === "EMERGENCY" ? "bad" : t.priority === "HIGH" ? "warn" : "neutral"}
                          >
                            {humanize(t.priority)}
                          </Badge>
                        </div>
                      </div>

                      <p className="mt-2 text-sm">{t.description}</p>

                      <div className="dim mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        <span>
                          Response target: {fmtDateTime(t.slaDueAt)}
                          {breached ? " — overdue" : ` (${relative(t.slaDueAt)})`}
                        </span>
                        {vendor && <span>Assigned to {vendor.name} · {vendor.phone}</span>}
                      </div>

                      {t.timeline.length > 0 && (
                        <ol className="mt-3 space-y-1.5 border-l-2 pl-3 text-xs hairline">
                          {t.timeline.map((e, i) => (
                            <li key={i}>
                              <span className="dim">{fmtDateTime(e.at)} · </span>
                              {e.text}
                            </li>
                          ))}
                        </ol>
                      )}

                      <div className="mt-3">
                        <CloseTicket id={String(t._id)} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          <Card title={`History (${resolved.length})`} subtitle="Closed and resolved requests.">
            {resolved.length === 0 ? (
              <Empty>Nothing resolved yet.</Empty>
            ) : (
              <ul className="space-y-3">
                {resolved.map((t) => (
                  <li
                    key={String(t._id)}
                    className="flex flex-wrap items-start justify-between gap-2 border-b hairline pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="dim text-xs">
                        {t.code} · {CATEGORY_LABELS[t.category]} ·{" "}
                        {t.resolvedAt ? `resolved ${relative(t.resolvedAt)}` : "closed"}
                      </p>
                    </div>
                    <Badge tone="good">{humanize(t.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="space-y-5">
          <Card title="Raise a new request" subtitle="The facility desk sees it immediately.">
            <NewTicketForm />
          </Card>

          <Card title="Response windows" subtitle="How fast we aim to respond, by urgency.">
            <ul className="space-y-2 text-sm">
              {Object.entries(SLA_HOURS).map(([priority, hours]) => (
                <li key={priority} className="flex items-center justify-between gap-2">
                  <span>{humanize(priority)}</span>
                  <Badge tone={priority === "EMERGENCY" ? "bad" : priority === "HIGH" ? "warn" : "neutral"}>
                    {hours} hours
                  </Badge>
                </li>
              ))}
            </ul>
            <p className="dim mt-3 text-xs">
              Pick Emergency only for water leaks, live wiring, lift entrapment or a security breach.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
