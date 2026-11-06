import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Avatar } from "@/components/display";
import { SettingsHeader } from "@/components/settings";
import { card } from "@/components/ui/styles";
import { getDb, schema } from "@/db";
import { requireUser } from "@/lib/auth/session";
import { ChangeEmailForm, NameForm } from "../forms";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const me = await requireUser();
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, me.id));
  return (
    <>
      <SettingsHeader title="Perfil" subtitle="Así te ven en la app. Tu nombre dentro de cada grupo se cambia en Personas." />
      <div className="mb-6 flex justify-center">
        <Avatar id={me.id} name={me.name} size={88} />
      </div>
      <div className="space-y-4">
        <section className={`${card} p-5`}>
          <NameForm name={me.name} />
        </section>
        <section className={`${card} p-5`}>
          <ChangeEmailForm email={me.email} hasPassword={!!user.passwordHash} />
        </section>
      </div>
    </>
  );
}
