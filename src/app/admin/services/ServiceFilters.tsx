"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";
import { PRIORITIES, TICKET_STATUSES } from "@/lib/types";
import { humanize } from "@/lib/fmt";

export default function ServiceFilters({
  categories,
}: {
  categories: Array<{ value: string; label: string }>;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function set(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v && v !== "ALL") next.set(k, v);
      else next.delete(k);
    }
    router.push(`/admin/services?${next.toString()}`);
  }

  const control =
    "surface rounded-lg border hairline px-2.5 py-2 text-sm outline-none focus:border-brand-500";

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="s-status" className="dim mb-1 block text-xs font-medium uppercase tracking-wide">
          Status
        </label>
        <select
          id="s-status"
          className={control}
          value={params.get("status") ?? "OPEN_ONLY"}
          onChange={(e) => set({ status: e.target.value })}
        >
          <option value="OPEN_ONLY">Open only</option>
          <option value="ALL">All statuses</option>
          {TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {humanize(s)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="s-category" className="dim mb-1 block text-xs font-medium uppercase tracking-wide">
          Category
        </label>
        <select
          id="s-category"
          className={control}
          value={params.get("category") ?? "ALL"}
          onChange={(e) => set({ category: e.target.value })}
        >
          <option value="ALL">All categories</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="s-priority" className="dim mb-1 block text-xs font-medium uppercase tracking-wide">
          Priority
        </label>
        <select
          id="s-priority"
          className={control}
          value={params.get("priority") ?? "ALL"}
          onChange={(e) => set({ priority: e.target.value })}
        >
          <option value="ALL">Any priority</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {humanize(p)}
            </option>
          ))}
        </select>
      </div>

      <Button variant="secondary" onClick={() => router.push("/admin/services")}>
        Reset
      </Button>
    </div>
  );
}
