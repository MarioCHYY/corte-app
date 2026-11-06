"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/ui/Form";
import { input } from "@/components/ui/styles";
import { login, signup } from "./actions";

interface Props {
  mode: "login" | "signup";
  next?: string;
  google?: boolean;
  initialError?: string;
}

export function AuthForm({ mode, next, google, initialError }: Props) {
  const [state, action] = useActionState(mode === "login" ? login : signup, undefined);
  // Con Google disponible, el correo es la segunda opción y se abre al pedirlo
  const [showEmail, setShowEmail] = useState(!google);
  const qs = next ? `?next=${encodeURIComponent(next)}` : "";
  const isSignup = mode === "signup";

  return (
    <div className="space-y-5">
      {initialError && !state && <FormMessage state={{ error: initialError }} />}

      {google && (
        <a
          href={`/api/auth/google${qs}`}
          className="group flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#dadce0] bg-white px-4 text-[15px] font-medium text-[#1f1f1f] shadow-sm transition hover:bg-[#f8f9fa] hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <GoogleIcon />
          {isSignup ? "Registrarme con Google" : "Continuar con Google"}
        </a>
      )}

      {google && !showEmail ? (
        <button
          type="button"
          onClick={() => setShowEmail(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-line text-[15px] font-medium text-paper/90 transition hover:border-mute/60 hover:bg-slate/60"
        >
          <MailIcon />
          {isSignup ? "Usar mi correo" : "Entrar con correo y contraseña"}
        </button>
      ) : (
        <>
          {google && (
            <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-mute">
              <span className="h-px flex-1 bg-line" />o con tu correo
              <span className="h-px flex-1 bg-line" />
            </div>
          )}
          <form action={action} className="space-y-4">
            {next && <input type="hidden" name="next" value={next} />}
            {isSignup && (
              <Field label="Tu nombre">
                <input name="name" autoComplete="given-name" required className={input} placeholder="Mario" autoFocus={google} />
              </Field>
            )}
            <Field label="Correo">
              <input name="email" type="email" autoComplete="email" required className={input} placeholder="tu@correo.com" autoFocus={google && !isSignup} />
            </Field>
            <Field label="Contraseña" hint={isSignup ? "Mínimo 8 caracteres" : undefined}>
              <input
                name="password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                minLength={isSignup ? 8 : undefined}
                className={input}
              />
            </Field>
            <FormMessage state={state} />
            <SubmitButton
              pendingText={isSignup ? "Creando cuenta…" : "Entrando…"}
              className="h-12 w-full rounded-xl bg-lime px-4 font-semibold text-ink transition hover:bg-lime-dim disabled:opacity-60"
            >
              {isSignup ? "Crear cuenta" : "Entrar"}
            </SubmitButton>
          </form>
        </>
      )}

      {isSignup && (
        <p className="text-center text-xs leading-relaxed text-mute">
          Al crear tu cuenta aceptas los{" "}
          <Link href="/terminos" className="underline hover:text-paper">
            Términos
          </Link>{" "}
          y el{" "}
          <Link href="/privacidad" className="underline hover:text-paper">
            Aviso de privacidad
          </Link>
          .
        </p>
      )}
      <p className="pt-1 text-center text-sm text-mute">
        {isSignup ? "¿Ya tienes cuenta? " : "¿Primera vez? "}
        <Link href={`${isSignup ? "/entrar" : "/registro"}${qs}`} className="font-medium text-lime hover:underline">
          {isSignup ? "Inicia sesión" : "Crea tu cuenta"}
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" className="h-5 w-5 shrink-0" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
