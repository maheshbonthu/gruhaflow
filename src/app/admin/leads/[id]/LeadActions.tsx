"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { inr, humanize } from "@/lib/fmt";
import {
  CALL_DISPOSITIONS,
  CALL_OUTCOMES,
  DEAD_STAGES,
  LEAD_STAGES,
  STAGE_LABELS,
  type AnyStage,
} from "@/lib/types";

const field =
  "surface w-full rounded-lg border hairline px-3 py-2 text-sm outline-none focus:border-brand-500";

/** Local datetime value for an <input type="datetime-local">. */
function localNow(offsetHours = 24): string {
  const d = new Date(Date.now() + offsetHours * 3600000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Every write a caller needs on one lead, in the order they actually happen:
 * log the call, mark the visit attended, then convert to a booking.
 */
export default function LeadActions({
  leadId,
  stage,
  hasBooking,
  units,
  visits,
}: {
  leadId: string;
  stage: AnyStage;
  hasBooking: boolean;
  units: Array<{ id: string; label: string; price: number }>;
  visits: Array<{ id: string; scheduledAt: string }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string>("CONNECTED");
  const [disposition, setDisposition] = useState<string>("INTERESTED");
  const [bookVisit, setBookVisit] = useState(false);

  async function send(label: string, url: string, method: string, body: unknown) {
    setBusy(label);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "That did not work.");
        return null;
      }
      router.refresh();
      return data;
    } catch {
      setError("Network error.");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function logCall(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const visitAtRaw = String(form.get("visitAt") ?? "");
    const followUpRaw = String(form.get("nextFollowUpAt") ?? "");

    const data = await send("call", "/api/calls", "POST", {
      leadId,
      outcome,
      disposition: outcome === "CONNECTED" ? disposition : "NO_DISPOSITION",
      durationSec: Number(form.get("durationSec") ?? 0),
      notes: String(form.get("notes") ?? ""),
      nextFollowUpAt: followUpRaw ? new Date(followUpRaw).toISOString() : "",
      visitAt: bookVisit && visitAtRaw ? new Date(visitAtRaw).toISOString() : "",
    });
    if (data) {
      setNotice(`Call logged. Lead is now "${STAGE_LABELS[data.stage as AnyStage] ?? data.stage}".`);
      (e.target as HTMLFormElement).reset();
      setBookVisit(false);
    }
  }

  async function markVisited(visitId: string) {
    const data = await send("visit", `/api/visits/${visitId}`, "PATCH", { status: "COMPLETED" });
    if (data) setNotice("Visit marked as attended. The lead moved to Visited site.");
  }

  async function convert(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = await send("booking", "/api/bookings", "POST", {
      leadId,
      unitId: String(form.get("unitId")),
    });
    if (data) {
      setNotice(
        data.tempPassword
          ? `Booked as ${data.code}. Buyer portal login created — temporary password ${data.tempPassword}.`
          : `Booked as ${data.code}.`
      );
    }
  }

  async function setStage(next: string) {
    const data = await send("stage", `/api/leads/${leadId}`, "PATCH", { stage: next });
    if (data) setNotice(`Stage set to "${STAGE_LABELS[next as AnyStage]}".`);
  }

  return (
    <div className="space-y-5">
      {(error || notice) && (
        <div
          className={[
            "rounded-lg px-3 py-2 text-sm",
            error
              ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
              : "bg-brand-100 text-brand-700 dark:bg-brand-700/25 dark:text-brand-300",
          ].join(" ")}
        >
          {error ?? notice}
        </div>
      )}

      <Card title="Log a call" subtitle="The lead's stage updates itself from the disposition.">
        <form onSubmit={logCall} className="space-y-3">
          <div>
            <label htmlFor="outcome" className="mb-1 block text-sm font-medium">Outcome</label>
            <select
              id="outcome"
              className={field}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            >
              {CALL_OUTCOMES.map((o) => (
                <option key={o} value={o}>{humanize(o)}</option>
              ))}
            </select>
          </div>

          {outcome === "CONNECTED" && (
            <>
              <div>
                <label htmlFor="disposition" className="mb-1 block text-sm font-medium">What they said</label>
                <select
                  id="disposition"
                  className={field}
                  value={disposition}
                  onChange={(e) => setDisposition(e.target.value)}
                >
                  {CALL_DISPOSITIONS.map((d) => (
                    <option key={d} value={d}>{humanize(d)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="durationSec" className="mb-1 block text-sm font-medium">
                  Call length (seconds)
                </label>
                <input id="durationSec" name="durationSec" type="number" min={0} defaultValue={120} className={field} />
              </div>
            </>
          )}

          <div>
            <label htmlFor="notes" className="mb-1 block text-sm font-medium">Notes</label>
            <textarea id="notes" name="notes" rows={3} className={field} placeholder="What was discussed?" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={bookVisit}
              onChange={(e) => setBookVisit(e.target.checked)}
              className="h-4 w-4"
            />
            Book a site visit from this call
          </label>

          {bookVisit && (
            <div>
              <label htmlFor="visitAt" className="mb-1 block text-sm font-medium">Visit slot</label>
              <input
                id="visitAt"
                name="visitAt"
                type="datetime-local"
                defaultValue={localNow(48)}
                className={field}
              />
            </div>
          )}

          <div>
            <label htmlFor="nextFollowUpAt" className="mb-1 block text-sm font-medium">
              Follow up on <span className="dim font-normal">(optional)</span>
            </label>
            <input id="nextFollowUpAt" name="nextFollowUpAt" type="datetime-local" className={field} />
          </div>

          <Button type="submit" disabled={busy === "call"} className="w-full">
            {busy === "call" ? "Saving…" : "Log call"}
          </Button>
        </form>
      </Card>

      {visits.length > 0 && (
        <Card title="Scheduled visits" subtitle="Mark attended once they actually turn up.">
          <ul className="space-y-2">
            {visits.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 text-sm">
                <span>{new Date(v.scheduledAt).toLocaleString("en-IN")}</span>
                <Button
                  variant="secondary"
                  disabled={busy === "visit"}
                  onClick={() => markVisited(v.id)}
                >
                  Mark attended
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {!hasBooking && (
        <Card
          title="Convert to a booking"
          subtitle="Creates the buyer's portal login, the 16-step handover checklist and the payment plan."
        >
          {units.length === 0 ? (
            <p className="dim text-sm">No unsold units are available to allot right now.</p>
          ) : (
            <form onSubmit={convert} className="space-y-3">
              <div>
                <label htmlFor="unitId" className="mb-1 block text-sm font-medium">Allot unit</label>
                <select id="unitId" name="unitId" className={field} required>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label} — {inr(u.price)}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={busy === "booking"} className="w-full">
                {busy === "booking" ? "Booking…" : "Confirm booking"}
              </Button>
            </form>
          )}
        </Card>
      )}

      <Card title="Move stage manually" subtitle="For corrections — normally the call log does this.">
        <div className="flex flex-wrap gap-1.5">
          {[...LEAD_STAGES, ...DEAD_STAGES]
            .filter((s) => s !== stage && s !== "BOOKED")
            .map((s) => (
              <button
                key={s}
                onClick={() => setStage(s)}
                disabled={busy === "stage"}
                className="surface-2 rounded-lg border hairline px-2.5 py-1.5 text-xs transition hover:brightness-95 disabled:opacity-50"
              >
                {STAGE_LABELS[s]}
              </button>
            ))}
        </div>
        <p className="dim mt-3 text-xs">
          Booked is not settable by hand — a lead becomes a buyer only by allotting a unit, so that a
          booking, a payment plan and a portal login always exist together.
        </p>
      </Card>
    </div>
  );
}
