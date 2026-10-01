"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Records or reverses a maintenance receipt. No gateway is wired up. */
export default function InvoiceActions({ id, paid }: { id: string; paid: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "MARK_PAID" | "MARK_DUE") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Could not update the invoice.");
      else router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="whitespace-nowrap">
      <button
        onClick={() => act(paid ? "MARK_DUE" : "MARK_PAID")}
        disabled={busy}
        className={[
          "rounded-lg px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50",
          paid ? "surface-2 border hairline" : "bg-brand-600 text-white hover:bg-brand-700",
        ].join(" ")}
      >
        {busy ? "…" : paid ? "Reopen" : "Mark paid"}
      </button>
      {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
