import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "./auth";

/** One place to turn thrown errors into the right HTTP status. */
export function fail(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") },
      { status: 422 }
    );
  }
  const message = err instanceof Error ? err.message : "Unexpected error";
  // A missing/unreachable database is a configuration problem, not a bug.
  const status = /MONGODB_URI|AUTH_SECRET|ECONNREFUSED|server selection/i.test(message)
    ? 503
    : 400;
  return NextResponse.json({ error: message }, { status });
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data as Record<string, unknown>, { status });
}
