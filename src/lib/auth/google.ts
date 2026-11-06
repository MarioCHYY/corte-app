import "server-only";
import { createHash, randomBytes } from "node:crypto";

/**
 * Inicio de sesión con Google (OAuth 2.0 / OpenID Connect con PKCE), sin librerías.
 * Variables: GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET. Si faltan, el botón no aparece.
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export const GOOGLE_COOKIE = "corte_google_oauth";

export function googleEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(origin: string): string {
  const base = process.env.APP_URL?.replace(/\/$/, "") || origin;
  return `${base}/api/auth/google/callback`;
}

const b64url = (buf: Buffer) => buf.toString("base64url");

/** Arma la URL de Google y lo que hay que guardar en una cookie para validar el regreso. */
export function createAuthRequest(origin: string, next: string) {
  const state = b64url(randomBytes(24));
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const url = new URL(AUTH_URL);
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return { url: url.toString(), cookie: JSON.stringify({ state, verifier, next }) };
}

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
}

/** Cambia el código que regresa Google por los datos de la persona. */
export async function exchangeCode(code: string, verifier: string, origin: string): Promise<GoogleProfile> {
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  if (!tokenRes.ok) throw new Error(`Google rechazó el código (${tokenRes.status})`);
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) throw new Error("Google no regresó un token");

  const infoRes = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${access_token}` } });
  if (!infoRes.ok) throw new Error(`No se pudieron leer los datos de Google (${infoRes.status})`);
  const info = (await infoRes.json()) as { sub: string; email?: string; email_verified?: boolean; name?: string; given_name?: string };
  if (!info.sub || !info.email) throw new Error("La cuenta de Google no tiene correo");
  return {
    sub: info.sub,
    email: info.email.toLowerCase(),
    emailVerified: info.email_verified === true,
    name: (info.given_name || info.name || info.email.split("@")[0]).slice(0, 60),
  };
}
