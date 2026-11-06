import type { Metadata } from "next";
import { Avatar } from "@/components/display";
import { SubmitButton } from "@/components/ui/Form";
import { btnGhost, card as cardCls } from "@/components/ui/styles";
import { newInviteCodeFor } from "@/lib/groups/actions";
import { loadGroup } from "@/lib/groups/data";
import { AddMemberForm, CopyInvite, RenameForm } from "./forms";

export const metadata: Metadata = { title: "Personas" };

export default async function PeoplePage({ params }: PageProps<"/g/[groupId]/personas">) {
  const { groupId } = await params;
  const data = await loadGroup(groupId);
  const isAdmin = data.me.role === "admin";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <section>
        <h1 className="font-display text-2xl font-bold">Personas</h1>
        <p className="text-sm text-mute">Puedes agregar a alguien aunque no tenga cuenta. Si después se une, elige su nombre y ve sus cuentas.</p>
        <ul className={`${cardCls} mt-4 divide-y divide-line`}>
          {data.members.map((m) => (
            <li key={m.id} className="px-5 py-3">
              <details>
                <summary className="flex cursor-pointer list-none items-center gap-3">
                  <Avatar id={m.id} name={m.name} size={36} />
                  <div className="flex-1">
                    <p className="font-medium">
                      {m.name}
                      {m.id === data.me.id && <span className="text-mute"> (tú)</span>}
                    </p>
                    <p className="text-xs text-mute">
                      {m.userId ? "Tiene cuenta" : "Sin cuenta"}
                      {m.role === "admin" && " · admin"}
                    </p>
                  </div>
                  <span className="text-xs text-mute">Editar</span>
                </summary>
                <div className="mt-3">
                  <RenameForm groupId={groupId} memberId={m.id} name={m.name} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>

      <div className="space-y-4">
        <section className={`${cardCls} p-5`}>
          <h2 className="font-display text-lg font-bold">Invitar al grupo</h2>
          <p className="mt-1 text-sm text-mute">Mándales este link o el código para que entren desde su celular.</p>
          <CopyInvite code={data.group.inviteCode} />
          {isAdmin && (
            <form action={newInviteCodeFor.bind(null, groupId)} className="mt-2">
              <SubmitButton className={btnGhost} pendingText="Cambiando…">
                Cambiar código
              </SubmitButton>
            </form>
          )}
        </section>
        <section className={`${cardCls} p-5`}>
          <h2 className="font-display text-lg font-bold">Agregar persona</h2>
          <div className="mt-3">
            <AddMemberForm groupId={groupId} />
          </div>
        </section>
      </div>
    </div>
  );
}
