"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * A resident can add a comment and close their own ticket. Everything else on a
 * ticket belongs to the facility desk.
 */
export default function CloseTicket({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  async function send(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Could not update the request.");
      else {
        setComment("");
        setOpen(false);
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="surface-2 rounded-lg border hairline px-2.5 py-1.5 text-xs transition hover:brightness-95"
        >
          Add a comment
        </button>
        <button
          onClick={() => send({ status: "CLOSED", comment: "Resident confirmed this is sorted." })}
          disabled={busy}
          className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {busy ? "…" : "This is sorted, close it"}
        </button>
      </div>

      {open && (
        <div className="mt-2 flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Anything to add for the technician?"
            className="surface flex-1 rounded-lg border hairline px-2.5 py-1.5 text-xs outline-none focus:border-brand-500"
          />
          <button
            onClick={() => comment.trim() && send({ comment })}
            disabled={busy || !comment.trim()}
            className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            Post
          </button>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
