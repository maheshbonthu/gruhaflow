import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { collections } from "./mongodb";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  readToken,
  signSession,
  type Session,
} from "./session";
import type { Role } from "./types";

export { SESSION_COOKIE, readToken, signSession, homeFor } from "./session";
export type { Session } from "./session";

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return readToken(jar.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(session: Session): Promise<void> {
  const token = await signSession(session);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/**
 * Thrown when the caller is missing or holds the wrong role. API routes catch
 * this and turn it into a 401/403.
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new AuthError("Not signed in", 401);
  return session;
}

export async function requireRole(...roles: Role[]): Promise<Session> {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    throw new AuthError("You do not have access to this action", 403);
  }
  return session;
}

/** ADMIN and MANAGER both see the whole business; AGENT sees only their own. */
export function isBackOffice(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export async function authenticate(email: string, password: string): Promise<Session | null> {
  const users = await collections.users();
  const user = await users.findOne({ email: email.trim().toLowerCase() });
  if (!user || !user.active) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return {
    uid: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
