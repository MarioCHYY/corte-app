import type { Metadata } from "next";
import { Avatar } from "@/components/display";
import { SubmitButton } from "@/components/ui/Form";
import { btnGhost, card } from "@/components/ui/styles";
import { setMemberRole } from "@/lib/groups/actions";
import { loadGroup } from "@/lib/groups/data";
import { DeleteGroupForm, LeaveGroupForm, RenameGroupForm } from "./forms";

export const metadata: Metadata = { title: "Ajustes del grupo" };

export default async function GroupSettingsPage({ params }: PageProps<"/g/[groupId]/ajustes">) {
  const { groupId } = await params;
  const data = await loadGroup(groupId);
  const isAdmin = data.me.role === "admin";
  const withAccount = data.members.filter((m) => m.userId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Ajustes del grupo</h1>

      <section className={`${card} p-6`}>
        <h2 className="font-display text-lg font-bold">Nombre del grupo</h2>
        <div className="mt-3">
          <RenameGroupForm groupId={groupId} name={data.group.name} />
        </div>
      </section>

      <section className={`${card} p-6`}>
        <h2 className="font-display text-lg font-bold">Administradores</h2>
        <p className="text-sm text-mute">Los admins pueden cambiar el código de invitación, nombrar a otros admins y eliminar el grupo.</p>
        <ul className="mt-4 divide-y divide-line rounded-2xl border border-line">
          {withAccount.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar id={m.id} name={m.name} size={32} />
              <span className="flex-1 text-sm font-medium">
                {m.name}
                {m.id === data.me.id && <span className="text-mute"> (tú)</span>}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${m.role === "admin" ? "bg-lime/15 text-lime" : "bg-slate text-mute"}`}>
                {m.role === "admin" ? "Admin" : "Miembro"}
              </span>
              {isAdmin && m.id !== data.me.id && (
                <form action={setMemberRole.bind(null, groupId, m.id, m.role === "admin" ? "member" : "admin")}>
                  <SubmitButton className={btnGhost} pendingText="…">
                    {m.role === "admin" ? "Quitar admin" : "Hacer admin"}
                  </SubmitButton>
                </form>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-mute">Solo las personas con cuenta pueden ser admins.</p>
      </section>

      <section className={`${card} p-6`}>
        <h2 className="font-display text-lg font-bold">Salir del grupo</h2>
        <p className="text-sm text-mute">
          Dejas de ver este grupo. Tu nombre se queda como persona sin cuenta para que las cuentas de los demás no cambien.
        </p>
        <LeaveGroupForm groupId={groupId} />
      </section>

      {isAdmin && (
        <section className="rounded-3xl border border-coral/40 bg-coral/5 p-6">
          <h2 className="font-display text-lg font-bold text-coral">Eliminar el grupo</h2>
          <p className="text-sm text-paper/80">
            Se borran para todos las personas, tarjetas, gastos y pagos de “{data.group.name}”. No se puede deshacer.
          </p>
          <DeleteGroupForm groupId={groupId} name={data.group.name} />
        </section>
      )}
    </div>
  );
}
