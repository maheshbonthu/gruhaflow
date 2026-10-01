import Link from "next/link";
import { redirect } from "next/navigation";
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
import { getSession } from "@/lib/auth";
import { humanize, relative } from "@/lib/fmt";
import { listLeads } from "@/lib/queries";
import { DEAD_STAGES, LEAD_STAGES, STAGE_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "My call list — GruhaFlow" };

const QUICK_FILTERS: Array<{ label: string; stage?: string }> = [
  { label: "Everything" },
  { label: "Never called", stage: "NEW" },
  { label: "Called", stage: "CALLED" },
  { label: "Interested", stage: "INTERESTED" },
  { label: "Visit scheduled", stage: "SITE_VISIT_SCHEDULED" },
  { label: "Visited", stage: "SITE_VISITED" },
  { label: "Negotiating", stage: "NEGOTIATION" },
  { label: "Booked", stage: "BOOKED" },
];

export default async function AgentLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/agent/leads");

  const sp = await searchParams;
  const result = await listLeads({
    agentId: session.uid,
    stage: sp.stage,
    page: Number(sp.page ?? 1) || 1,
    perPage: 60,
  });

  const pages = Math.max(1, Math.ceil(result.total / result.perPage));

  return (
    <div>
      <PageHeader
        title="My call list"
        subtitle={`${result.total.toLocaleString("en-IN")} leads assigned to you in this view.`}
      />

      <Card className="mb-5">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_FILTERS.map((f) => {
            const active = (sp.stage ?? "") === (f.stage ?? "");
            return (
              <Link
                key={f.label}
                href={f.stage ? `/agent/leads?stage=${f.stage}` : "/agent/leads"}
                className={[
                  "rounded-lg border hairline px-3 py-1.5 text-sm transition",
                  active ? "bg-brand-600 font-medium text-white" : "surface-2 hover:brightness-95",
                ].join(" ")}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        <p className="dim mt-3 text-xs">
          Stages past booking are read-only here. Dead ends ({DEAD_STAGES.map((d) => STAGE_LABELS[d]).join(", ")}) stay
          on your list so you can revive them later.
        </p>
      </Card>

      <Card>
        {result.rows.length === 0 ? (
          <Empty>Nothing in this view. Try another filter.</Empty>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Lead</Th>
                  <Th>Stage</Th>
                  <Th>Project</Th>
                  <Th>Source</Th>
                  <Th align="right">Calls</Th>
                  <Th>Last call</Th>
                  <Th align="right">Budget</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {result.rows.map((lead) => (
                  <tr key={lead.id}>
                    <Td>
                      <Link href={`/agent/leads/${lead.id}`} className="font-medium hover:underline">
                        {lead.name}
                      </Link>
                      <p className="dim text-xs">
                        <a href={`tel:${lead.phone}`} className="hover:underline">
                          {lead.phone}
                        </a>
                      </p>
                    </Td>
                    <Td>
                      <Badge tone={toneForStatus(lead.stage)}>{STAGE_LABELS[lead.stage]}</Badge>
                    </Td>
                    <Td className="whitespace-nowrap text-sm">{lead.projectName}</Td>
                    <Td className="dim whitespace-nowrap text-xs">{humanize(lead.source)}</Td>
                    <Td align="right" className="tabular-nums">{lead.callCount}</Td>
                    <Td className="dim whitespace-nowrap text-xs">{relative(lead.lastCallAt)}</Td>
                    <Td align="right" className="whitespace-nowrap tabular-nums">{lead.budget}</Td>
                    <Td align="right">
                      <Link
                        href={`/agent/leads/${lead.id}`}
                        className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white"
                      >
                        Work this
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {pages > 1 && (
              <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                <span className="dim">
                  Page {result.page} of {pages}
                </span>
                <div className="flex gap-2">
                  {result.page > 1 && (
                    <Link
                      href={`/agent/leads?${new URLSearchParams({
                        ...(sp.stage ? { stage: sp.stage } : {}),
                        page: String(result.page - 1),
                      })}`}
                      className="surface-2 rounded-lg border hairline px-3 py-1.5"
                    >
                      ← Previous
                    </Link>
                  )}
                  {result.page < pages && (
                    <Link
                      href={`/agent/leads?${new URLSearchParams({
                        ...(sp.stage ? { stage: sp.stage } : {}),
                        page: String(result.page + 1),
                      })}`}
                      className="surface-2 rounded-lg border hairline px-3 py-1.5"
                    >
                      Next →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
