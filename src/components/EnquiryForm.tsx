"use client";

import { useState } from "react";

const BUDGETS = [
  { label: "Not sure yet", min: "", max: "" },
  { label: "Under ₹50 L", min: "0", max: "5000000" },
  { label: "₹50 L – ₹1 Cr", min: "5000000", max: "10000000" },
  { label: "₹1 Cr – ₹2 Cr", min: "10000000", max: "20000000" },
  { label: "Above ₹2 Cr", min: "20000000", max: "" },
];

/**
 * The "Contact builder" form. On submit the visitor becomes a lead in the CRM
 * and lands on a tele-caller's list — the first step of the funnel.
 */
export default function EnquiryForm({
  projectId,
  projectName,
  compact = false,
}: {
  projectId?: string;
  projectName?: string;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState(0);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const chosen = BUDGETS[budget];

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          email: form.get("email") || "",
          message: form.get("message") || "",
          projectId,
          budgetMin: chosen.min || undefined,
          budgetMax: chosen.max || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send your enquiry.");
      } else {
        setDone(data.message ?? "Thanks! We will call you shortly.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "surface w-full rounded-lg border hairline px-3 py-2 text-sm outline-none focus:border-brand-500";

  if (done) {
    return (
      <div className="rounded-lg bg-brand-100 p-4 text-sm text-brand-700 dark:bg-brand-700/25 dark:text-brand-300">
        <p className="font-semibold">Enquiry received</p>
        <p className="mt-1">{done}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {!compact && (
        <p className="dim text-xs">
          {projectName
            ? `An advisor for ${projectName} will call you. No spam, and you can opt out on the first call.`
            : "An advisor will call you to understand what you are looking for."}
        </p>
      )}

      <div className={compact ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>
        <div>
          <label htmlFor="eq-name" className="mb-1 block text-sm font-medium">
            Your name
          </label>
          <input id="eq-name" name="name" required minLength={2} className={field} />
        </div>
        <div>
          <label htmlFor="eq-phone" className="mb-1 block text-sm font-medium">
            Phone
          </label>
          <input
            id="eq-phone"
            name="phone"
            required
            inputMode="tel"
            placeholder="9876543210"
            className={field}
          />
        </div>
      </div>

      <div>
        <label htmlFor="eq-email" className="mb-1 block text-sm font-medium">
          Email <span className="dim font-normal">(optional)</span>
        </label>
        <input id="eq-email" name="email" type="email" className={field} />
      </div>

      <div>
        <label htmlFor="eq-budget" className="mb-1 block text-sm font-medium">
          Budget
        </label>
        <select
          id="eq-budget"
          className={field}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
        >
          {BUDGETS.map((b, i) => (
            <option key={b.label} value={i}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="eq-message" className="mb-1 block text-sm font-medium">
          Anything specific? <span className="dim font-normal">(optional)</span>
        </label>
        <textarea
          id="eq-message"
          name="message"
          rows={compact ? 2 : 3}
          placeholder="East facing, higher floor, possession before 2028…"
          className={field}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {busy ? "Sending…" : "Request a call back"}
      </button>
    </form>
  );
}
