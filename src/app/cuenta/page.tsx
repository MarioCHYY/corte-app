import { and, eq, gt } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { Avatar } from "@/components/display";
import { SettingsGroup, SettingsRow } from "@/components/settings";
import { SubmitButton } from "@/components/ui/Form";
import { getDb, schema } from "@/db";
import { requireUser } from "@/lib/auth/session";
import { SITE } from "@/lib/site";
import pkg from "../../../package.json";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Mi cuenta" };

const dateFmt = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "America/Mexico_City" });

export default async function AccountPage() {
  const me = await requireUser();
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, me.id));
  const sessionCount = (
    await db
      .select({ id: schema.sessions.id })
      .from(schema.sessions)
      .where(and(eq(schema.sessions.userId, me.id), gt(schema.sessions.expiresAt, new Date())))
  ).length;
  const groupCount = (await db.select({ id: schema.members.id }).from(schema.members).where(eq(schema.members.userId, me.id))).length;
  const methods = [user.googleId && "Google", user.passwordHash && "Contraseña"].filter(Boolean).join(" y ");

  return (
    <>
      <Link href="/grupos" className="inline-flex items-center gap-1 text-sm text-mute hover:text-paper">
        <Icon name="chevronLeft" className="h-4 w-4" /> Mis grupos
      </Link>

      {/* Tarjeta de perfil */}
      <Link
        href="/cuenta/perfil"
        className="mb-8 mt-3 flex items-center gap-4 rounded-3xl border border-line bg-slate-2 p-5 transition hover:border-lime/50"
      >
        <Avatar id={me.id} name={me.name} size={64} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-2xl font-bold">{me.name}</p>
          <p className="truncate text-mute">{me.email}</p>
          <p className="mt-0.5 text-xs text-mute">
            En corte desde {dateFmt.format(user.createdAt)} · {groupCount} {groupCount === 1 ? "grupo" : "grupos"}
          </p>
        </div>
        <Icon name="chevronRight" className="h-5 w-5 text-mute" />
      </Link>

      <SettingsGroup title="Cuenta">
        <SettingsRow icon={<Icon name="user" />} label="Perfil" detail="Nombre y correo" href="/cuenta/perfil" />
        <SettingsRow icon={<Icon name="users" />} label="Mis grupos" detail="Casas, roomies y viajes" href="/grupos" />
        <SettingsRow icon={<Icon name="phone" />} label="Instalar en tu celular" detail="Agrégala a tu pantalla de inicio" href="/instalar" />
      </SettingsGroup>

      <SettingsGroup title="Inicio de sesión y seguridad">
        <SettingsRow icon={<Icon name="key" />} label="Contraseña y métodos para entrar" detail={methods || "—"} href="/cuenta/seguridad" />
        <SettingsRow icon={<Icon name="phone" />} label="Sesiones abiertas" detail="Dispositivos donde has entrado" value={sessionCount} href="/cuenta/sesiones" />
      </SettingsGroup>

      <SettingsGroup title="Privacidad y datos">
        <SettingsRow icon={<Icon name="shield" />} label="Privacidad y datos" detail="Qué guardamos y cómo descargarlo" href="/cuenta/privacidad" />
        <SettingsRow icon={<Icon name="download" />} label="Descargar mis datos" detail="Un archivo con tu cuenta, grupos y gastos" href="/api/cuenta/exportar" />
        <SettingsRow icon={<Icon name="trash" />} label="Eliminar cuenta" href="/cuenta/eliminar" tone="danger" />
      </SettingsGroup>

      <SettingsGroup title="Soporte">
        <SettingsRow icon={<Icon name="help" />} label="Centro de ayuda" detail="Preguntas frecuentes" href="/ayuda" />
        <SettingsRow
          icon={<Icon name="message" />}
          label="Contactar a soporte"
          detail={SITE.contactEmail}
          href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Ayuda con corte")}`}
        />
        <SettingsRow
          icon={<Icon name="bug" />}
          label="Reportar un problema"
          detail="Cuéntanos qué pasó"
          href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Problema en corte")}&body=${encodeURIComponent(
            "¿Qué estabas haciendo?\n\n¿Qué pasó?\n\n¿Qué esperabas que pasara?\n\n(Si puedes, agrega una captura de pantalla)",
          )}`}
        />
      </SettingsGroup>

      <SettingsGroup title="Legal">
        <SettingsRow icon={<Icon name="file" />} label="Términos y condiciones" href="/terminos" />
        <SettingsRow icon={<Icon name="lock" />} label="Aviso de privacidad" href="/privacidad" />
      </SettingsGroup>

      <form action={logout} className="mb-6">
        <SubmitButton
          pendingText="Cerrando sesión…"
          className="w-full rounded-2xl border border-line bg-slate-2 px-4 py-3.5 font-semibold text-coral transition hover:bg-coral/10"
        >
          Cerrar sesión
        </SubmitButton>
      </form>

      <p className="text-center text-xs text-mute">corte versión {pkg.version} · Hecho en México</p>
    </>
  );
}
