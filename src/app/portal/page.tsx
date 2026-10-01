import Link from "next/link";
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
import PropertyMedia from "@/components/PropertyMedia";
import { getSession } from "@/lib/auth";
import { fmtDate, inr, inrExact, pct, relative } from "@/lib/fmt";
import { getCustomerView } from "@/lib/queries";
import { CATEGORY_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "My home — The Urban Firm" };

export default async function PortalHome() {
  const session = await getSession();
  if (!session) redirect("/login?next=/portal");

  const view = await getCustomerView(session.uid);

  if (!view.booking) {
    return (
      <div>
        <PageHeader title={`Welcome, ${session.name.split(" ")[0]}`} />
        <Card title="No booking linked to this account yet">
          <p className="text-sm">
            Once your booking is confirmed, this is where your unit, your handover timeline and your
            payment schedule will appear.
          </p>
          <Link
            href="/properties"
            className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
          >
            Browse projects
          </Link>
        </Card>
      </div>
    );
  }

  const b = view.booking;
  const now = Date.now();
  const nextStep = view.steps.find((s) => s.status !== "DONE");
  const nextPayment = view.payments.find((p) => p.status !== "PAID");
  const openTickets = view.tickets.filter((t) => !["RESOLVED", "CLOSED"].includes(t.status));
  const unpaidBills = view.invoices.filter((i) => i.status !== "PAID");
  const duesTotal = unpaidBills.reduce((s, i) => s + i.amount, 0);
  const handedOver = b.status === "HANDED_OVER";

  return (
    <div>
      <PageHeader
        title={`Welcome, ${session.name.split(" ")[0]}`}
        subtitle={`Booking ${b.code} · ${b.projectName}, ${b.locality}`}
        action={
          <Badge tone={handedOver ? "good" : "brand"}>
            {handedOver ? "Handed over" : "Under construction"}
          </Badge>
        }
      />

      {/* The flat itself. */}
      <div className="surface overflow-hidden rounded-xl border hairline shadow-sm">
        <div className="grid sm:grid-cols-[220px_1fr]">
          <div className="h-40 sm:h-auto">
            <PropertyMedia seed={b.projectName} label={b.projectName} className="h-full w-full" />
          </div>
          <div className="p-5">
            <h2 className="text-lg font-semibold tracking-tight">
              {b.projectName} · Unit {b.unitNo}
            </h2>
            <p className="dim mt-1 text-sm">
              Tower {b.tower}, floor {b.floor} · {b.bhk} BHK · {b.sqft} sqft · {b.facing} facing
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["Booked on", fmtDate(b.bookingDate)],
                ["Agreement value", inr(b.totalAmount)],
                ["Possession", b.possession],
                ["Your advisor", b.agentName],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="dim text-xs uppercase tracking-wide">{k}</dt>
                  <dd className="mt-0.5 text-sm font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="dim mt-3 text-xs">
              Questions? Call {b.agentName} on{" "}
              <a href={`tel:${b.agentPhone}`} className="hover:underline">
                {b.agentPhone}
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      <StatGrid cols={4}>
        <Stat
          label="Handover progress"
          value={`${view.progress}%`}
          tone="brand"
          hint={`${view.steps.filter((s) => s.status === "DONE").length} of ${view.steps.length} steps done`}
        />
        <Stat
          label="Paid so far"
          value={inr(view.paid)}
          tone="good"
          hint={`${pct(view.paid, b.totalAmount)} of agreement value`}
        />
        <Stat
          label="Open service requests"
          value={openTickets.length}
          tone={openTickets.length ? "warn" : "good"}
        />
        <Stat
          label="Maintenance dues"
          value={duesTotal ? inrExact(duesTotal) : "₹0"}
          tone={duesTotal ? "bad" : "good"}
          hint={`${unpaidBills.length} unpaid bills`}
        />
      </StatGrid>

      <div className="mt-4">
        <Progress value={view.progress} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card
          title="What is happening right now"
          subtitle="The one thing your project team is working on next."
          action={
            <Link href="/portal/journey" className="text-brand-600 dark:text-brand-300 text-sm hover:underline">
              Full timeline →
            </Link>
          }
        >
          {nextStep ? (
            <div>
              <div className="flex items-center gap-2">
                <Badge tone={toneForStatus(nextStep.status)}>
                  {nextStep.status.replace("_", " ").toLowerCase()}
                </Badge>
                {nextStep.dueAt.getTime() < now && <Badge tone="bad">Behind schedule</Badge>}
              </div>
              <h3 className="mt-2 text-lg font-semibold">{nextStep.title}</h3>
              <p className="dim mt-1 text-sm">
                Handled by {nextStep.owner} · target {fmtDate(nextStep.dueAt)}
              </p>
              {nextStep.note && <p className="mt-2 text-sm italic">{nextStep.note}</p>}
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold">Gruha Pravesham complete 🎉</h3>
              <p className="dim mt-1 text-sm">
                Every handover milestone is done. From here, this portal is for maintenance and
                service requests.
              </p>
            </div>
          )}
        </Card>

        <Card
          title="Next payment"
          subtitle="Construction-linked, so it falls due as the building rises."
          action={
            <Link href="/portal/payments" className="text-brand-600 dark:text-brand-300 text-sm hover:underline">
              All payments →
            </Link>
          }
        >
          {nextPayment ? (
            <div>
              <p className="text-2xl font-semibold">{inrExact(nextPayment.amount)}</p>
              <p className="mt-1 text-sm font-medium">{nextPayment.label}</p>
              <p className="dim mt-0.5 text-sm">
                Due {fmtDate(nextPayment.dueAt)}
                {nextPayment.dueAt.getTime() < now ? " — overdue" : ` · ${relative(nextPayment.dueAt)}`}
              </p>
              {nextPayment.dueAt.getTime() < now && (
                <p className="mt-2">
                  <Badge tone="bad">Please clear this to avoid holding up registration</Badge>
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm">Every instalment is cleared. Nothing outstanding.</p>
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card
          title="My service requests"
          subtitle={handedOver ? "Plumbing, electrical, security — anything in the building." : "Available once you take possession."}
          action={
            <Link href="/portal/services" className="text-brand-600 dark:text-brand-300 text-sm hover:underline">
              Raise or track →
            </Link>
          }
        >
          {view.tickets.length === 0 ? (
            <Empty>No service requests raised yet.</Empty>
          ) : (
            <ul className="space-y-3">
              {view.tickets.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="dim text-xs">
                      {CATEGORY_LABELS[t.category]} · {t.code} · {relative(t.createdAt)}
                    </p>
                  </div>
                  <Badge tone={toneForStatus(t.status)}>{t.status.replace("_", " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Maintenance bills"
          action={
            <Link href="/portal/bills" className="text-brand-600 dark:text-brand-300 text-sm hover:underline">
              All bills →
            </Link>
          }
        >
          {view.invoices.length === 0 ? (
            <Empty>No bills raised yet. Billing starts after handover.</Empty>
          ) : (
            <ul className="space-y-3">
              {view.invoices.slice(0, 5).map((inv) => (
                <li key={String(inv._id)} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{inv.period}</p>
                    <p className="dim text-xs">Due {fmtDate(inv.dueAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">{inrExact(inv.amount)}</p>
                    <Badge
                      tone={
                        inv.status === "PAID"
                          ? "good"
                          : inv.dueAt.getTime() < now
                            ? "bad"
                            : "warn"
                      }
                    >
                      {inv.status === "PAID" ? "Paid" : inv.dueAt.getTime() < now ? "Overdue" : "Due"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
