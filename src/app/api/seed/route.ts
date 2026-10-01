import { seedDatabase } from "@/lib/seed";
import { fail, ok } from "@/lib/api";

export const maxDuration = 60;

/**
 * Rebuilds the demo dataset. Destructive, so it needs the SEED_TOKEN either as
 * `?token=` or an `x-seed-token` header. There is deliberately no GET handler,
 * to keep a stray link or crawler from wiping the database.
 */
export async function POST(req: Request) {
  try {
    const expected = process.env.SEED_TOKEN;
    if (!expected) {
      return ok({ error: "SEED_TOKEN is not configured on the server." }, 503);
    }
    const url = new URL(req.url);
    const supplied = req.headers.get("x-seed-token") ?? url.searchParams.get("token");
    if (supplied !== expected) {
      return ok({ error: "Bad seed token." }, 401);
    }

    const started = Date.now();
    const summary = await seedDatabase();
    return ok({ ok: true, ms: Date.now() - started, summary });
  } catch (err) {
    return fail(err);
  }
}
