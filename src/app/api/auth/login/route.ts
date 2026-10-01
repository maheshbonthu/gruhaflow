import { z } from "zod";
import { authenticate, homeFor, setSessionCookie } from "@/lib/auth";
import { fail, ok } from "@/lib/api";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const { email, password } = Body.parse(await req.json());
    const session = await authenticate(email, password);
    if (!session) {
      return ok({ error: "Wrong email or password." }, 401);
    }
    await setSessionCookie(session);
    return ok({ ok: true, role: session.role, redirect: homeFor(session.role) });
  } catch (err) {
    return fail(err);
  }
}
