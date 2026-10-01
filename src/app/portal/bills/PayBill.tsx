"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { inrExact } from "@/lib/fmt";

/** Records a maintenance receipt. No gateway is connected in this build. */
export default function PayBill({ id, amount }: { id: string; amount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "MARK_PAID" }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Could not record the payment.");
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
        onClick={pay}
        disabled={busy}
        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {busy ? "Recording…" : `Pay ${inrExact(amount)}`}
      </button>
      {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
