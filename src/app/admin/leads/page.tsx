import Link from "next/link";
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
import { humanize, relative } from "@/lib/fmt";
import { collections } from "@/lib/mongodb";
import { listLeads } from "@/lib/queries";
import { DEAD_STAGES, LEAD_STAGES, STAGE_LABELS } from "@/lib/types";
import LeadFilters from "./LeadFilters";
import NewLeadButton from "./NewLeadButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads & calls — The Urban Firm" };

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1) || 1;

  const users = await collections.users();
  const projects = await collections.projects();

  const [result, staff, projectDocs] = await Promise.all([
    listLeads({
      stage: sp.stage,
      agentId: sp.agent,
      projectId: sp.project,
      q: sp.q,
      page,
    }),
    users.find({ role: { $in: ["AGENT", "MANAGER"] } }).sort({ name: 1 }).toArray(),
    projects.find({}).sort({ name: 1 }).toArray(),
  ]);

  const agentOptions = staff.map((s) => ({ id: String(s._id), name: s.name }));
  const projectOptions = projectDocs.map((p) => ({ id: String(p._id), name: p.name }));
  const pages = Math.max(1, Math.ceil(result.total / result.perPage));

  function pageLink(n: number): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== "page") params.set(k, v);
    params.set("page", String(n));
    return `/admin/leads?${params.toString()}`;
  }

  return (
    <div>
      <PageHeader
        title="Leads & calls"
        subtitle={`${result.total.toLocaleString("en-IN")} leads match the current filter.`}
        action={<NewLeadButton agents={agentOptions} projects={projectOptions} />}
      />

      <Card className="mb-5">
        <LeadFilters
          agents={agentOptions}
          projects={projectOptions}
          stages={[...LEAD_STAGES, ...DEAD_STAGES].map((s) => ({ value: s, label: STAGE_LABELS[s] }))}
        />
      </Card>

      <Card>
        {result.rows.length === 0 ? (
          <Empty>No leads match that filter. Try clearing it, or add a lead.</Empty>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Lead</Th>
                  <Th>Stage</Th>
                  <Th>Agent</Th>
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
                      <Link href={`/admin/leads/${lead.id}`} className="font-medium hover:underline">
                        {lead.name}
                      </Link>
                      <p className="dim text-xs">{lead.phone}</p>
                    </Td>
                    <Td>
                      <Badge tone={toneForStatus(lead.stage)}>{STAGE_LABELS[lead.stage]}</Badge>
                    </Td>
                    <Td className="whitespace-nowrap">{lead.agentName}</Td>
                    <Td className="whitespace-nowrap">{lead.projectName}</Td>
                    <Td className="dim whitespace-nowrap text-xs">{humanize(lead.source)}</Td>
                    <Td align="right" className="tabular-nums">{lead.callCount}</Td>
                    <Td className="dim whitespace-nowrap text-xs">{relative(lead.lastCallAt)}</Td>
                    <Td align="right" className="whitespace-nowrap tabular-nums">{lead.budget}</Td>
                    <Td align="right">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="text-brand-600 dark:text-brand-300 text-sm whitespace-nowrap hover:underline"
                      >
                        Open →
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
                      href={pageLink(result.page - 1)}
                      className="surface-2 rounded-lg border hairline px-3 py-1.5"
                    >
                      ← Previous
                    </Link>
                  )}
                  {result.page < pages && (
                    <Link
                      href={pageLink(result.page + 1)}
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
