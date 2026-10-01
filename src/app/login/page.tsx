import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in — The Urban Firm" };

const DEMO_LOGINS = [
  { role: "Admin", email: "admin@theurbanfirm.in", what: "Everything: funnel, handover, maintenance, billing" },
  { role: "Sales manager", email: "manager@theurbanfirm.in", what: "Whole-business dashboards and the team leaderboard" },
  { role: "Tele-call agent", email: "priya@theurbanfirm.in", what: "Own call list, dispositions and site visits" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));
  const { next } = await searchParams;

  return (
    <main className="mx-auto grid min-h-screen max-w-5xl items-center gap-8 px-4 py-10 lg:grid-cols-2">
      <div>
        <Link href="/" className="dim text-sm hover:underline">
          ← Back to site
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Sign in to The Urban Firm</h1>
        <p className="dim mt-2 text-sm">
          One login, three views. Staff land on the sales and operations console; buyers land on
          their own home-buying tracker.
        </p>
        <LoginForm next={next} />
      </div>

      <div className="surface rounded-xl border hairline p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Demo logins</h2>
        <p className="dim mt-1 text-xs">
          Every seeded account uses the password <code className="surface-2 rounded px-1 py-0.5">demo1234</code>.
        </p>
        <ul className="mt-4 space-y-3">
          {DEMO_LOGINS.map((d) => (
            <li key={d.email} className="border-b hairline pb-3 last:border-0 last:pb-0">
              <p className="text-sm font-medium">{d.role}</p>
              <p className="text-brand-600 dark:text-brand-300 text-sm">{d.email}</p>
              <p className="dim mt-0.5 text-xs">{d.what}</p>
            </li>
          ))}
          <li>
            <p className="text-sm font-medium">Buyer / resident</p>
            <p className="dim mt-0.5 text-xs">
              Any buyer email listed under Admin → Customers also works with{" "}
              <code className="surface-2 rounded px-1 py-0.5">demo1234</code>. The seeded buyers are
              real leads that converted, so each one has a different handover stage and a different
              set of maintenance tickets.
            </p>
          </li>
        </ul>
      </div>
    </main>
  );
}
