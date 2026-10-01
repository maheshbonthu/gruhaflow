import { NextResponse, type NextRequest } from "next/server";
import { homeFor, readToken, SESSION_COOKIE } from "@/lib/session";

/**
 * Gate the three portals at the edge so an unauthenticated request never even
 * reaches a page that would query Mongo. Role mismatches bounce to the portal
 * the user does belong to rather than to a dead end.
 */
const RULES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/admin", roles: ["ADMIN", "MANAGER"] },
  { prefix: "/agent", roles: ["ADMIN", "MANAGER", "AGENT"] },
  { prefix: "/portal", roles: ["CUSTOMER", "ADMIN"] },
];


export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const rule = RULES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  if (!rule) return NextResponse.next();

  const session = await readToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!rule.roles.includes(session.role)) {
    const url = req.nextUrl.clone();
    url.pathname = homeFor(session.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/agent/:path*", "/portal/:path*"],
};
