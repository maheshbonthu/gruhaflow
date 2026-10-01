"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Records the outcome of a booked visit. Attending is what pushes the lead to
 * SITE_VISITED, so this is also where the honest feedback and rating land.
 */
export default function MarkAttended({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(4);

  async function save(status: "COMPLETED" | "NO_SHOW" | "CANCELLED") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/visits/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status,
          feedback: feedback.trim() || undefined,
          rating: status === "COMPLETED" ? rating : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Could not update the visit.");
      else {
        setOpen(false);
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white"
      >
        Record outcome
      </button>
    );
  }

  return (
    <div className="min-w-[220px] space-y-2 text-left">
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={2}
        placeholder="What did they say on site?"
        className="surface w-full rounded-lg border hairline px-2 py-1.5 text-xs outline-none focus:border-brand-500"
      />
      <label className="dim flex items-center gap-2 text-xs">
        Rating
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="surface rounded-lg border hairline px-2 py-1 text-xs"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => save("COMPLETED")}
          disabled={busy}
          className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          Attended
        </button>
        <button
          onClick={() => save("NO_SHOW")}
          disabled={busy}
          className="surface-2 rounded-lg border hairline px-2.5 py-1.5 text-xs disabled:opacity-50"
        >
          No-show
        </button>
        <button onClick={() => setOpen(false)} className="dim px-1.5 py-1.5 text-xs">
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
