import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { SettingsGroup, SettingsHeader, SettingsRow } from "@/components/settings";
import { SubmitButton } from "@/components/ui/Form";
import { btnGhost, card } from "@/components/ui/styles";
import { getDb, schema } from "@/db";
import { unlinkGoogle } from "@/lib/account/actions";
import { googleEnabled } from "@/lib/auth/google";
import { requireUser } from "@/lib/auth/session";
import { PasswordForm } from "../forms";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Inicio de sesión y seguridad" };

export default async function SecurityPage() {
  const me = await requireUser();
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, me.id));
  const hasPassword = !!user.passwordHash;
  const hasGoogle = !!user.googleId;

  return (
    <>
      <SettingsHeader title="Inicio de sesión y seguridad" subtitle="Cómo entras a tu cuenta." />

      <SettingsGroup
        title="Métodos para entrar"
        footer={hasGoogle && !hasPassword ? "Para desvincular Google primero crea una contraseña, así no te quedas sin forma de entrar." : undefined}
      >
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg font-bold text-[#4285F4]" aria-hidden>
            G
          </span>
          <span className="flex-1">
            <span className="block font-medium">Google</span>
            <span className="block text-sm text-mute">{hasGoogle ? "Vinculada" : "No vinculada"}</span>
          </span>
          {hasGoogle ? (
            hasPassword ? (
              <form action={unlinkGoogle}>
                <SubmitButton className={btnGhost} pendingText="…">
                  Desvincular
                </SubmitButton>
              </form>
            ) : (
              <span className="text-xs text-mute">Tu único acceso</span>
            )
          ) : googleEnabled() ? (
            <a href="/api/auth/google?next=/cuenta/seguridad" className="rounded-xl bg-lime px-3 py-2 text-sm font-semibold text-ink">
              Vincular
            </a>
          ) : (
            <span className="text-xs text-mute">No disponible</span>
          )}
        </div>
        <SettingsRow icon={<Icon name="mail" />} label="Correo y contraseña" detail={hasPassword ? "Activo" : "Sin contraseña todavía"} />
      </SettingsGroup>

      <section className={`${card} p-5`}>
        <h2 className="font-display text-lg font-bold">{hasPassword ? "Cambiar contraseña" : "Crear contraseña"}</h2>
        <p className="mb-4 text-sm text-mute">
          {hasPassword ? "Al cambiarla cerramos tus sesiones en otros dispositivos." : "Para poder entrar también con tu correo, sin Google."}
        </p>
        <PasswordForm hasPassword={hasPassword} />
      </section>

      <div className="mt-6">
        <SettingsGroup>
          <SettingsRow icon={<Icon name="phone" />} label="Sesiones abiertas" detail="Revisa dónde está abierta tu cuenta" href="/cuenta/sesiones" />
        </SettingsGroup>
      </div>
    </>
  );
}
