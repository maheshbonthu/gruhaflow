import Link from "next/link";
import type { ReactNode } from "react";
import type { Session } from "@/lib/auth";
import SideNav from "./SideNav";
import { NAV_ROOTS, ROLE_LABEL, navFor, type NavItem } from "./nav";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** One shell for all three portals; only the nav list differs by role. */
export default function Shell({
  session,
  children,
  extraNav,
}: {
  session: Session;
  children: ReactNode;
  extraNav?: NavItem[];
}) {
  const items = [...navFor(session.role), ...(extraNav ?? [])];

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar on desktop, a horizontal scroller on phones. */}
      <aside className="surface border-b hairline lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              GF
            </span>
            <span className="text-sm font-semibold tracking-tight">GruhaFlow</span>
          </Link>
          <div className="flex items-center gap-2 lg:mt-4">
            <span className="surface-2 grid h-8 w-8 place-items-center rounded-full text-xs font-semibold">
              {initials(session.name)}
            </span>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-medium">{session.name}</p>
              <p className="dim truncate text-xs">{ROLE_LABEL[session.role]}</p>
            </div>
          </div>
        </div>

        <SideNav items={items} roots={NAV_ROOTS} />

        <form action="/api/auth/logout" method="post" className="px-3 pb-3 lg:mt-4">
          <button
            type="submit"
            className="dim w-full rounded-lg px-3 py-2 text-left text-sm hover:surface-2"
          >
            Sign out
          </button>
        </form>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
