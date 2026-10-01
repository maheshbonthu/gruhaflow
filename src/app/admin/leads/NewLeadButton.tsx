"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { LEAD_SOURCES } from "@/lib/types";
import { humanize } from "@/lib/fmt";

interface Option {
  id: string;
  name: string;
}

export default function NewLeadButton({
  agents,
  projects,
}: {
  agents: Option[];
  projects: Option[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    setBusy(false);

    if (!res.ok) {
      setError(body.error ?? "Could not save the lead.");
      return;
    }
    setOpen(false);
    router.push(`/admin/leads/${body.leadId}`);
  }

  const field =
    "surface w-full rounded-lg border hairline px-3 py-2 text-sm outline-none focus:border-brand-500";

  if (!open) return <Button onClick={() => setOpen(true)}>+ Add lead</Button>;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="surface max-h-full w-full max-w-lg overflow-y-auto rounded-xl border hairline p-5 shadow-lg">
        <h2 className="text-base font-semibold">Add a lead</h2>
        <p className="dim mt-1 text-xs">
          New leads start at stage <strong>New</strong>. They move on their own as calls get logged.
        </p>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">Name</label>
              <input id="name" name="name" required minLength={2} className={field} />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium">Phone</label>
              <input id="phone" name="phone" required placeholder="9876543210" className={field} />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email <span className="dim font-normal">(optional)</span>
            </label>
            <input id="email" name="email" type="email" className={field} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="source" className="mb-1 block text-sm font-medium">Source</label>
              <select id="source" name="source" className={field} defaultValue="WEBSITE">
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>{humanize(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="projectId" className="mb-1 block text-sm font-medium">Project</label>
              <select id="projectId" name="projectId" className={field} defaultValue="">
                <option value="">Not decided yet</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label htmlFor="assignedAgentId" className="mb-1 block text-sm font-medium">Assign to</label>
              <select id="assignedAgentId" name="assignedAgentId" className={field} defaultValue="">
                <option value="">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="budgetMin" className="mb-1 block text-sm font-medium">Budget from (₹)</label>
              <input id="budgetMin" name="budgetMin" type="number" min={0} step={100000} className={field} />
            </div>
            <div>
              <label htmlFor="budgetMax" className="mb-1 block text-sm font-medium">Budget to (₹)</label>
              <input id="budgetMax" name="budgetMax" type="number" min={0} step={100000} className={field} />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="mb-1 block text-sm font-medium">Notes</label>
            <textarea id="notes" name="notes" rows={2} className={field} />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save lead"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
