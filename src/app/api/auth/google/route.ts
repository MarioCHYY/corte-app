import { NextResponse, type NextRequest } from "next/server";
import { createAuthRequest, GOOGLE_COOKIE, googleEnabled } from "@/lib/auth/google";
import { safeNext } from "@/lib/form";

/** Manda a la persona a la pantalla de Google. */
export async function GET(req: NextRequest) {
  if (!googleEnabled()) return NextResponse.redirect(new URL("/entrar", req.url));
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const { url, cookie } = createAuthRequest(req.nextUrl.origin, next);
  const res = NextResponse.redirect(url);
  res.cookies.set(GOOGLE_COOKIE, cookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return res;
}
