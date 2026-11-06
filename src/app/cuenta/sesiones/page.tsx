import { and, asc, eq, gt } from "drizzle-orm";
import type { Metadata } from "next";
import { SettingsGroup, SettingsHeader } from "@/components/settings";
import { SubmitButton } from "@/components/ui/Form";
import { btnGhost } from "@/components/ui/styles";
import { getDb, schema } from "@/db";
import { signOutOthers, signOutSession } from "@/lib/account/actions";
import { describeUserAgent } from "@/lib/account/userAgent";
import { currentSessionId, requireUser } from "@/lib/auth/session";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Sesiones abiertas" };

const fmt = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City" });

export default async function SessionsPage() {
  const me = await requireUser();
  const db = await getDb();
  const sid = await currentSessionId();
  const sessions = await db
    .select()
    .from(schema.sessions)
    .where(and(eq(schema.sessions.userId, me.id), gt(schema.sessions.expiresAt, new Date())))
    .orderBy(asc(schema.sessions.createdAt));
  const sorted = [...sessions].sort((a, b) => Number(b.id === sid) - Number(a.id === sid));

  return (
    <>
      <SettingsHeader title="Sesiones abiertas" subtitle="Dispositivos donde tu cuenta está abierta. Si no reconoces alguno, ciérralo." />
      <SettingsGroup footer="Las sesiones se cierran solas después de 30 días.">
        {sorted.map((s) => {
          const ua = describeUserAgent(s.userAgent);
          const current = s.id === sid;
          return (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate text-paper/80">
                <Icon name={ua.mobile ? "phone" : "laptop"} />
              </span>
              <span className="flex-1">
                <span className="block font-medium">
                  {ua.browser}
                  {ua.os && ` en ${ua.os}`}
                </span>
                <span className="block text-sm text-mute">{current ? "Esta sesión · ahora" : `Desde el ${fmt.format(s.createdAt)}`}</span>
              </span>
              {current ? (
                <span className="rounded-full bg-lime/15 px-2.5 py-1 text-xs font-medium text-lime">Activa</span>
              ) : (
                <form action={signOutSession.bind(null, s.id)}>
                  <SubmitButton className={btnGhost} pendingText="…">
                    Cerrar
                  </SubmitButton>
                </form>
              )}
            </div>
          );
        })}
      </SettingsGroup>
      {sessions.length > 1 && (
        <form action={signOutOthers}>
          <SubmitButton
            pendingText="Cerrando…"
            className="w-full rounded-2xl border border-line bg-slate-2 px-4 py-3.5 font-semibold text-coral transition hover:bg-coral/10"
          >
            Cerrar todas las demás sesiones
          </SubmitButton>
        </form>
      )}
    </>
  );
}
