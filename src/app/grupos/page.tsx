import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { SubmitButton } from "@/components/ui/Form";
import { btnSecondary, card } from "@/components/ui/styles";
import { requireUser } from "@/lib/auth/session";
import { createDemoGroup } from "@/lib/groups/actions";
import { listMyGroups } from "@/lib/groups/data";
import { CreateGroupForm, JoinByCodeForm } from "./forms";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Mis grupos" };

export default async function GroupsPage() {
  const user = await requireUser();
  const groups = await listMyGroups(user.id);

  return (
    <>
      <AppHeader userName={user.name} userId={user.id} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Hola, {user.name.split(" ")[0]}</h1>
        <p className="mt-1 text-mute">
          {groups.length ? "Elige un grupo para ver cómo van las cuentas." : "Crea tu primer grupo o únete al de tu familia."}
        </p>

        {groups.length > 0 && (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {groups.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/g/${g.id}`}
                  className={`${card} flex items-center justify-between gap-3 p-5 transition hover:border-lime/60`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-bold">{g.name}</p>
                    <p className="text-sm text-mute">
                      Eres {g.myName}
                      {g.role === "admin" ? " · admin" : ""}
                    </p>
                  </div>
                  <Icon name="chevronRight" className="h-6 w-6 text-lime" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <section className={`${card} p-5`}>
            <h2 className="font-display text-lg font-bold">Crear un grupo</h2>
            <p className="mt-1 text-sm text-mute">Para tu casa, tus roomies o un viaje.</p>
            <CreateGroupForm defaultName={user.name} />
          </section>
          <section className={`${card} p-5`}>
            <h2 className="font-display text-lg font-bold">Unirme con código</h2>
            <p className="mt-1 text-sm text-mute">Pídele el código a quien creó el grupo.</p>
            <JoinByCodeForm />
          </section>
          <section className={`${card} border-lime/30 p-5`}>
            <h2 className="font-display text-lg font-bold">Ver un ejemplo</h2>
            <p className="mt-1 text-sm text-mute">
              Crea una casa de prueba donde todos usan la tarjeta de Perla, con gastos, meses sin intereses y pagos.
            </p>
            <form action={createDemoGroup} className="mt-4">
              <SubmitButton pendingText="Creando ejemplo…" className={`${btnSecondary} w-full`}>
                Crear grupo de ejemplo
              </SubmitButton>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
