"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORY_LABELS, PRIORITIES, SERVICE_CATEGORIES } from "@/lib/types";
import { humanize } from "@/lib/fmt";

export default function NewTicketForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: form.get("category"),
          priority: form.get("priority"),
          title: form.get("title"),
          description: form.get("description"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not raise the request.");
        return;
      }
      (e.target as HTMLFormElement).reset();
      setDone(true);
      router.refresh();
      setTimeout(() => setDone(false), 4000);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "surface w-full rounded-lg border hairline px-3 py-2 text-sm outline-none focus:border-brand-500";

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor="t-category" className="mb-1 block text-sm font-medium">
          What is it about?
        </label>
        <select id="t-category" name="category" className={field} defaultValue="PLUMBING" required>
          {SERVICE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="t-priority" className="mb-1 block text-sm font-medium">
          How urgent?
        </label>
        <select id="t-priority" name="priority" className={field} defaultValue="MEDIUM" required>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {humanize(p)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="t-title" className="mb-1 block text-sm font-medium">
          One-line summary
        </label>
        <input
          id="t-title"
          name="title"
          required
          minLength={4}
          maxLength={140}
          placeholder="Kitchen sink draining slowly"
          className={field}
        />
      </div>

      <div>
        <label htmlFor="t-description" className="mb-1 block text-sm font-medium">
          Details
        </label>
        <textarea
          id="t-description"
          name="description"
          required
          minLength={5}
          rows={4}
          placeholder="Where exactly, since when, and anything already tried."
          className={field}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
          {error}
        </p>
      )}
      {done && (
        <p className="rounded-lg bg-brand-100 px-3 py-2 text-sm text-brand-700 dark:bg-brand-700/25 dark:text-brand-300">
          Request raised. The facility desk has it.
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {busy ? "Sending…" : "Raise request"}
      </button>
    </form>
  );
}
