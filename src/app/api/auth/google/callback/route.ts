import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getDb, schema } from "@/db";
import { exchangeCode, GOOGLE_COOKIE, googleEnabled } from "@/lib/auth/google";
import { createSession, getCurrentUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/form";
import { newId } from "@/lib/ids";

function fail(req: NextRequest, message: string) {
  const url = new URL("/entrar", req.url);
  url.searchParams.set("error", message);
  const res = NextResponse.redirect(url);
  res.cookies.delete({ name: GOOGLE_COOKIE, path: "/api/auth/google" });
  return res;
}

const sameString = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Google regresa aquí con un código. Se valida, se busca o crea la cuenta y se inicia sesión. */
export async function GET(req: NextRequest) {
  if (!googleEnabled()) return fail(req, "El inicio con Google no está configurado");
  const params = req.nextUrl.searchParams;
  if (params.get("error")) return fail(req, "Cancelaste el inicio con Google");

  let saved: { state: string; verifier: string; next: string };
  try {
    saved = JSON.parse(req.cookies.get(GOOGLE_COOKIE)?.value ?? "");
  } catch {
    return fail(req, "Se venció el intento de inicio de sesión. Inténtalo otra vez");
  }
  const code = params.get("code");
  const state = params.get("state") ?? "";
  if (!code || !saved?.state || !sameString(state, saved.state)) {
    return fail(req, "No se pudo verificar el inicio con Google. Inténtalo otra vez");
  }

  let profile;
  try {
    profile = await exchangeCode(code, saved.verifier, req.nextUrl.origin);
  } catch (e) {
    console.error("[google]", e);
    return fail(req, "Google no respondió bien. Inténtalo otra vez");
  }

  const db = await getDb();
  let [user] = await db.select().from(schema.users).where(eq(schema.users.googleId, profile.sub));

  // Vincular Google desde "Mi cuenta" estando ya dentro
  const current = await getCurrentUser();
  if (current) {
    if (user && user.id !== current.id) return fail(req, "Esa cuenta de Google ya está ligada a otro usuario de corte");
    if (!user) await db.update(schema.users).set({ googleId: profile.sub }).where(eq(schema.users.id, current.id));
    const res = NextResponse.redirect(new URL(safeNext(saved.next), req.url));
    res.cookies.delete({ name: GOOGLE_COOKIE, path: "/api/auth/google" });
    return res;
  }

  if (!user) {
    const [byEmail] = await db.select().from(schema.users).where(eq(schema.users.email, profile.email));
    if (byEmail) {
      // Ligar solo si Google confirma que el correo es de esa persona
      if (!profile.emailVerified) return fail(req, "Tu correo de Google no está verificado");
      [user] = await db.update(schema.users).set({ googleId: profile.sub }).where(eq(schema.users.id, byEmail.id)).returning();
    } else {
      [user] = await db
        .insert(schema.users)
        .values({ id: newId(), name: profile.name, email: profile.email, googleId: profile.sub, passwordHash: null })
        .returning();
    }
  }

  await createSession(user.id);
  const res = NextResponse.redirect(new URL(safeNext(saved.next), req.url));
  res.cookies.delete({ name: GOOGLE_COOKIE, path: "/api/auth/google" });
  return res;
}
