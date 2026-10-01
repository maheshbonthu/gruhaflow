import { redirect } from "next/navigation";
import {
  Badge,
  Card,
  Empty,
  PageHeader,
  Progress,
  Stat,
  StatGrid,
  toneForStatus,
} from "@/components/ui";
import { getSession } from "@/lib/auth";
import { fmtDate, relative } from "@/lib/fmt";
import { getCustomerView } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Handover progress — GruhaFlow" };

const STATUS_COPY: Record<string, string> = {
  DONE: "Done",
  IN_PROGRESS: "In progress",
  BLOCKED: "Needs attention",
  PENDING: "Not started",
};

export default async function JourneyPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/portal/journey");

  const view = await getCustomerView(session.uid);
  if (!view.booking) {
    return (
      <div>
        <PageHeader title="Handover progress" />
        <Card>
          <Empty>No booking is linked to this account yet.</Empty>
        </Card>
      </div>
    );
  }

  const now = Date.now();
  const done = view.steps.filter((s) => s.status === "DONE").length;
  const blocked = view.steps.filter((s) => s.status === "BLOCKED").length;
  const overdue = view.steps.filter((s) => s.status !== "DONE" && s.dueAt.getTime() < now).length;

  return (
    <div>
      <PageHeader
        title="Your journey to Gruha Pravesham"
        subtitle={`Every step from your booking to the day you light the first lamp. ${view.steps.length} milestones in total.`}
      />

      <StatGrid cols={4}>
        <Stat label="Completed" value={`${done} / ${view.steps.length}`} tone="good" />
        <Stat label="Overall progress" value={`${view.progress}%`} tone="brand" />
        <Stat label="Behind schedule" value={overdue} tone={overdue ? "warn" : "good"} />
        <Stat label="Needs attention" value={blocked} tone={blocked ? "bad" : "good"} />
      </StatGrid>

      <div className="mt-4">
        <Progress value={view.progress} tone={overdue ? "warn" : "brand"} />
      </div>

      <Card className="mt-5" title="Milestones" subtitle="Updated by your project team as work completes.">
        <ol className="relative">
          {view.steps.map((step, i) => {
            const isOverdue = step.status !== "DONE" && step.dueAt.getTime() < now;
            const isLast = i === view.steps.length - 1;
            return (
              <li key={String(step._id)} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Connector line down the timeline. */}
                {!isLast && (
                  <span
                    className={[
                      "absolute left-[11px] top-7 h-full w-0.5",
                      step.status === "DONE" ? "bg-brand-500" : "surface-2",
                    ].join(" ")}
                    aria-hidden
                  />
                )}

                <span
                  className={[
                    "relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                    step.status === "DONE"
                      ? "bg-brand-600 text-white"
                      : step.status === "BLOCKED"
                        ? "bg-rose-500 text-white"
                        : step.status === "IN_PROGRESS"
                          ? "bg-amber-500 text-white"
                          : "surface-2",
                  ].join(" ")}
                  aria-hidden
                >
                  {step.status === "DONE" ? "✓" : i + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{step.title}</h3>
                    <Badge tone={toneForStatus(step.status)}>{STATUS_COPY[step.status]}</Badge>
                    {isOverdue && <Badge tone="bad">Behind schedule</Badge>}
                  </div>
                  <p className="dim mt-1 text-sm">
                    Handled by {step.owner} ·{" "}
                    {step.completedAt
                      ? `completed ${fmtDate(step.completedAt)}`
                      : `target ${fmtDate(step.dueAt)} (${relative(step.dueAt)})`}
                  </p>
                  {step.note && (
                    <p className="surface-2 mt-2 rounded-lg px-3 py-2 text-sm">{step.note}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      <Card className="mt-5" title="What happens after the last step">
        <p className="text-sm">
          Once Gruha Pravesham is marked complete, this portal switches from tracking construction to
          running your home: raise electricity, plumbing, interior, security or housekeeping requests
          and see your monthly maintenance bills. Nothing closes down — your advisor and the facility
          desk stay reachable from the same login.
        </p>
      </Card>
    </div>
  );
}
