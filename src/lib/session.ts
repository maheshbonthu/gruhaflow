import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./types";

/**
 * Session primitives that must stay edge-safe: the middleware imports this and
 * nothing else, so nothing here may touch bcrypt, the Mongo driver or any other
 * Node-only module. Password hashing and database lookups live in auth.ts.
 */

export const SESSION_COOKIE = "gf_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export interface Session {
  uid: string;
  name: string;
  email: string;
  role: Role;
}

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set.");
  return new TextEncoder().encode(value);
}

export async function signSession(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

/** Verifies a raw token. Safe to call from middleware. */
export async function readToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      uid: String(payload.uid),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

/** Where each role lands after signing in. */
export function homeFor(role: Role): string {
  if (role === "CUSTOMER") return "/portal";
  if (role === "AGENT") return "/agent";
  return "/admin";
}
