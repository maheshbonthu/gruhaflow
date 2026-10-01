"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Td, toneForStatus } from "@/components/ui";
import { fmtDateTime, humanize, relative } from "@/lib/fmt";
import { CATEGORY_LABELS, TICKET_STATUSES, type ServiceCategory } from "@/lib/types";

export interface TicketView {
  id: string;
  code: string;
  title: string;
  customerName: string;
  unitNo: string;
  projectName: string;
  category: ServiceCategory;
  priority: string;
  status: string;
  vendorName?: string;
  slaDueAt: string;
  createdAt: string;
  breached: boolean;
}

/**
 * One ticket row the facility desk can act on without leaving the table:
 * assign a vendor, move the status, or drop a note on the timeline.
 */
export default function TicketRowActions({
  ticket,
  vendors,
}: {
  ticket: TicketView;
  vendors: Array<{ id: string; name: string; category: string }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState("");

  // Offer the matching trade first, then everyone else.
  const matching = vendors.filter((v) => v.category === ticket.category);
  const others = vendors.filter((v) => v.category !== ticket.category);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/services/${ticket.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Could not update the ticket.");
      else {
        setComment("");
        setCommentOpen(false);
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  const control =
    "surface rounded-lg border hairline px-2 py-1.5 text-xs outline-none focus:border-brand-500 disabled:opacity-50";

  return (
    <tr>
      <Td>
        <p className="text-sm font-medium">{ticket.title}</p>
        <p className="dim font-mono text-xs">{ticket.code}</p>
      </Td>
      <Td className="whitespace-nowrap">
        <p className="text-sm">{ticket.customerName}</p>
        <p className="dim text-xs">
          {ticket.projectName} · {ticket.unitNo}
        </p>
      </Td>
      <Td className="whitespace-nowrap text-sm">{CATEGORY_LABELS[ticket.category]}</Td>
      <Td>
        <Badge
          tone={
            ticket.priority === "EMERGENCY"
              ? "bad"
              : ticket.priority === "HIGH"
                ? "warn"
                : "neutral"
          }
        >
          {humanize(ticket.priority)}
        </Badge>
      </Td>
      <Td className="whitespace-nowrap">
        {ticket.breached ? (
          <Badge tone="bad">Breached {relative(ticket.slaDueAt)}</Badge>
        ) : (
          <span className="dim text-xs" title={fmtDateTime(ticket.slaDueAt)}>
            due {relative(ticket.slaDueAt)}
          </span>
        )}
      </Td>
      <Td className="whitespace-nowrap">
        <select
          aria-label={`Assign vendor for ${ticket.code}`}
          className={control}
          disabled={busy}
          value=""
          onChange={(e) => e.target.value && patch({ vendorId: e.target.value })}
        >
          <option value="">{ticket.vendorName ?? "Assign vendor…"}</option>
          {matching.length > 0 && (
            <optgroup label={CATEGORY_LABELS[ticket.category]}>
              {matching.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="Other trades">
            {others.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </optgroup>
        </select>
      </Td>
      <Td>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={toneForStatus(ticket.status)}>{humanize(ticket.status)}</Badge>
          <select
            aria-label={`Status for ${ticket.code}`}
            className={control}
            disabled={busy}
            value={ticket.status}
            onChange={(e) => patch({ status: e.target.value })}
          >
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </select>
          <button
            onClick={() => setCommentOpen((v) => !v)}
            className="dim text-xs hover:underline"
          >
            Note
          </button>
        </div>

        {commentOpen && (
          <div className="mt-2 flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Update for the resident…"
              className="surface flex-1 rounded-lg border hairline px-2 py-1.5 text-xs outline-none focus:border-brand-500"
            />
            <button
              onClick={() => comment.trim() && patch({ comment })}
              disabled={busy || !comment.trim()}
              className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              Post
            </button>
          </div>
        )}

        {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      </Td>
    </tr>
  );
}
