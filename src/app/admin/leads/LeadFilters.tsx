"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

interface Option {
  id: string;
  name: string;
}

/** Filters write straight to the query string so every view is shareable. */
export default function LeadFilters({
  agents,
  projects,
  stages,
}: {
  agents: Option[];
  projects: Option[];
  stages: Array<{ value: string; label: string }>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  function apply(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value && value !== "ALL") next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    router.push(`/admin/leads?${next.toString()}`);
  }

  const select =
    "surface rounded-lg border hairline px-2.5 py-2 text-sm outline-none focus:border-brand-500";

  return (
    <div className="flex flex-wrap items-end gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
        className="flex-1 min-w-[220px]"
      >
        <label htmlFor="q" className="dim mb-1 block text-xs font-medium uppercase tracking-wide">
          Search
        </label>
        <input
          id="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, phone or email"
          className={`${select} w-full`}
        />
      </form>

      <div>
        <label htmlFor="stage" className="dim mb-1 block text-xs font-medium uppercase tracking-wide">
          Stage
        </label>
        <select
          id="stage"
          className={select}
          defaultValue={params.get("stage") ?? "ALL"}
          onChange={(e) => apply({ stage: e.target.value })}
        >
          <option value="ALL">All stages</option>
          {stages.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="agent" className="dim mb-1 block text-xs font-medium uppercase tracking-wide">
          Agent
        </label>
        <select
          id="agent"
          className={select}
          defaultValue={params.get("agent") ?? "ALL"}
          onChange={(e) => apply({ agent: e.target.value })}
        >
          <option value="ALL">All agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="project" className="dim mb-1 block text-xs font-medium uppercase tracking-wide">
          Project
        </label>
        <select
          id="project"
          className={select}
          defaultValue={params.get("project") ?? "ALL"}
          onChange={(e) => apply({ project: e.target.value })}
        >
          <option value="ALL">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <Button
        variant="secondary"
        onClick={() => {
          setQ("");
          router.push("/admin/leads");
        }}
      >
        Clear
      </Button>
    </div>
  );
}
