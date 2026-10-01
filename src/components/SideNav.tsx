"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./nav";

/** Highlights the current section. Client-only because it needs the pathname. */
export default function SideNav({ items, roots }: { items: NavItem[]; roots: string[] }) {
  const pathname = usePathname();

  return (
    <nav className="scroll-x flex gap-1 px-2 pb-2 lg:mt-2 lg:block lg:space-y-0.5 lg:px-3">
      {items.map((item) => {
        const isRoot = roots.includes(item.href);
        const active = isRoot
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={[
              "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition",
              active
                ? "bg-brand-600 font-medium text-white"
                : "dim hover:surface-2 hover:text-[color:var(--text)]",
            ].join(" ")}
          >
            <span>{item.label}</span>
            {item.badge ? (
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                  active ? "bg-white/20" : "surface-2",
                ].join(" ")}
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
