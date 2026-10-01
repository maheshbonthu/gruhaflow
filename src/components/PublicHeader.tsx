import Link from "next/link";
import { getSession, homeFor } from "@/lib/auth";

export default async function PublicHeader() {
  const session = await getSession();

  return (
    <header className="surface sticky top-0 z-40 border-b hairline">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            GF
          </span>
          <span className="font-semibold tracking-tight">GruhaFlow</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm md:flex">
          <Link href="/properties" className="dim transition hover:text-[color:var(--text)]">
            Buy
          </Link>
          <Link href="/properties?status=NEW_LAUNCH" className="dim transition hover:text-[color:var(--text)]">
            New launches
          </Link>
          <Link href="/properties?status=READY_TO_MOVE" className="dim transition hover:text-[color:var(--text)]">
            Ready to move
          </Link>
          <Link href="/properties?type=VILLA" className="dim transition hover:text-[color:var(--text)]">
            Villas
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <Link
              href={homeFor(session.role)}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              My portal
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="surface rounded-lg border hairline px-3 py-2 text-sm font-medium transition hover:brightness-95"
              >
                Sign in
              </Link>
              <Link
                href="/properties"
                className="hidden rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 sm:block"
              >
                Browse homes
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
