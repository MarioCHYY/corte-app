import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { SettingsHeader } from "@/components/settings";
import { getDb, schema } from "@/db";
import { requireUser } from "@/lib/auth/session";
import { DeleteAccountForm } from "../forms";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Eliminar cuenta" };

export default async function DeleteAccountPage() {
  const me = await requireUser();
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, me.id));
  const groupCount = (await db.select({ id: schema.members.id }).from(schema.members).where(eq(schema.members.userId, me.id))).length;

  return (
    <>
      <SettingsHeader title="Eliminar cuenta" subtitle="Lamentamos que te vayas." back="/cuenta/privacidad" backLabel="Privacidad y datos" />
      <section className="rounded-3xl border border-coral/40 bg-coral/5 p-6">
        <h2 className="font-display text-lg font-bold">Qué pasa si eliminas tu cuenta</h2>
        <ul className="mt-3 space-y-3 text-sm text-paper/85">
          <li className="flex gap-3">
            <Icon name="trash" className="mt-0.5 h-5 w-5 text-coral" />
            <span>Se borran tu cuenta, tu contraseña y tus sesiones. No se puede deshacer.</span>
          </li>
          <li className="flex gap-3">
            <Icon name="users" className="mt-0.5 h-5 w-5 text-coral" />
            <span>
              En los grupos que compartes ({groupCount}), tu nombre se queda como persona sin cuenta para que las cuentas de los demás no se
              descuadren.
            </span>
          </li>
          <li className="flex gap-3">
            <Icon name="home" className="mt-0.5 h-5 w-5 text-coral" />
            <span>Los grupos donde nadie más tiene cuenta se borran completos.</span>
          </li>
          <li className="flex gap-3">
            <Icon name="download" className="mt-0.5 h-5 w-5 text-coral" />
            <span>
              Si quieres conservar tu información,{" "}
              <a href="/api/cuenta/exportar" className="font-medium text-lime hover:underline">
                descarga tus datos
              </a>{" "}
              antes.
            </span>
          </li>
        </ul>
        <DeleteAccountForm hasPassword={!!user.passwordHash} />
      </section>
    </>
  );
}
