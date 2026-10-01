"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, toneForStatus } from "@/components/ui";
import { fmtDate } from "@/lib/fmt";
import { STEP_STATUSES, type StepStatus } from "@/lib/types";

const LABEL: Record<StepStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  DONE: "Done",
};

/** One milestone row with an inline status control and an optional note. */
export default function StepRow({
  id,
  title,
  owner,
  status,
  dueAt,
  completedAt,
  note,
}: {
  id: string;
  title: string;
  owner: string;
  status: StepStatus;
  dueAt: string;
  completedAt?: string;
  note?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(note ?? "");

  const overdue = status !== "DONE" && new Date(dueAt).getTime() < Date.now();

  async function save(next: StepStatus, withNote = noteText) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/journey/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next, note: withNote || undefined }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Could not update that step.");
      else {
        setNoteOpen(false);
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="border-b hairline py-2.5 last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={[
                "grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs",
                status === "DONE" ? "bg-brand-600 text-white" : "surface-2",
              ].join(" ")}
              aria-hidden
            >
              {status === "DONE" ? "✓" : ""}
            </span>
            <p className="truncate text-sm font-medium">{title}</p>
            {overdue && <Badge tone="bad">Overdue</Badge>}
          </div>
          <p className="dim mt-0.5 pl-7 text-xs">
            {owner} · due {fmtDate(dueAt)}
            {completedAt ? ` · completed ${fmtDate(completedAt)}` : ""}
          </p>
          {note && !noteOpen && <p className="mt-1 pl-7 text-xs italic">{note}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge tone={toneForStatus(status)}>{LABEL[status]}</Badge>
          <select
            aria-label={`Status for ${title}`}
            value={status}
            disabled={busy}
            onChange={(e) => save(e.target.value as StepStatus)}
            className="surface rounded-lg border hairline px-2 py-1.5 text-xs outline-none focus:border-brand-500 disabled:opacity-50"
          >
            {STEP_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LABEL[s]}
              </option>
            ))}
          </select>
          <button
            onClick={() => setNoteOpen((v) => !v)}
            className="dim text-xs hover:underline"
          >
            {note ? "Edit note" : "Add note"}
          </button>
        </div>
      </div>

      {noteOpen && (
        <div className="mt-2 pl-7">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={2}
            placeholder="What is holding this up, or what was done?"
            className="surface w-full rounded-lg border hairline px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <div className="mt-1.5 flex gap-2">
            <button
              onClick={() => save(status, noteText)}
              disabled={busy}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save note"}
            </button>
            <button onClick={() => setNoteOpen(false)} className="dim px-2 py-1.5 text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 pl-7 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </li>
  );
}
