import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CorteLogo } from "@/components/brand/Logo";
import { btnPrimary } from "@/components/ui/styles";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { JoinForm } from "./JoinForm";

export const metadata: Metadata = { title: "Unirme a un grupo" };

export default async function JoinPage({ params }: PageProps<"/unirse/[code]">) {
  const { code: raw } = await params;
  const code = raw.toUpperCase();
  const db = await getDb();
  const [group] = await db.select().from(schema.groups).where(eq(schema.groups.inviteCode, code));
  const user = await getCurrentUser();

  let body: React.ReactNode;
  if (!group) {
    body = (
      <>
        <h1 className="font-display text-2xl font-bold">Este link ya no funciona</h1>
        <p className="mt-2 text-sm text-mute">Pídele un código nuevo a quien te invitó.</p>
      </>
    );
  } else if (!user) {
    const next = `/unirse/${code}`;
    body = (
      <>
        <p className="text-sm text-mute">Te invitaron a</p>
        <h1 className="font-display text-3xl font-bold">{group.name}</h1>
        <p className="mt-3 text-sm text-mute">Primero entra o crea tu cuenta, y luego te unes.</p>
        <div className="mt-6 grid gap-2">
          <Link href={`/registro?next=${encodeURIComponent(next)}`} className={btnPrimary}>
            Crear cuenta
          </Link>
          <Link href={`/entrar?next=${encodeURIComponent(next)}`} className="py-2 text-center text-sm font-medium text-lime hover:underline">
            Ya tengo cuenta
          </Link>
        </div>
      </>
    );
  } else {
    const [mine] = await db
      .select({ id: schema.members.id })
      .from(schema.members)
      .where(and(eq(schema.members.groupId, group.id), eq(schema.members.userId, user.id)));
    if (mine) redirect(`/g/${group.id}`);
    const people = await db.select().from(schema.members).where(eq(schema.members.groupId, group.id));
    body = (
      <>
        <p className="text-sm text-mute">Te invitaron a</p>
        <h1 className="font-display text-3xl font-bold">{group.name}</h1>
        <JoinForm
          code={code}
          defaultName={user.name}
          free={people.filter((p) => !p.userId).map((p) => ({ id: p.id, name: p.name }))}
          taken={people.filter((p) => p.userId).map((p) => p.name)}
        />
      </>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Link href="/" aria-label="Inicio">
        <CorteLogo className="h-10 w-auto" />
      </Link>
      <div className="mt-8 w-full max-w-sm rounded-3xl border border-line bg-slate-2 p-6 sm:p-8">{body}</div>
    </main>
  );
}
