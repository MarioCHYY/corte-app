"use client";

import { useActionState, useState } from "react";
import { FormMessage, SubmitButton } from "@/components/ui/Form";
import { btnSecondary, input } from "@/components/ui/styles";
import { deleteGroup, leaveGroup, renameGroup } from "@/lib/groups/actions";

export function RenameGroupForm({ groupId, name }: { groupId: string; name: string }) {
  const [state, action] = useActionState(renameGroup.bind(null, groupId), undefined);
  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <input name="name" required maxLength={60} defaultValue={name} className={input} aria-label="Nombre del grupo" />
        <SubmitButton className={btnSecondary} pendingText="…">
          Guardar
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function LeaveGroupForm({ groupId }: { groupId: string }) {
  const [state, action] = useActionState(leaveGroup.bind(null, groupId), undefined);
  return (
    <form action={action} className="mt-4 space-y-2">
      <FormMessage state={state} />
      <SubmitButton className={btnSecondary} pendingText="Saliendo…">
        Salir del grupo
      </SubmitButton>
    </form>
  );
}

export function DeleteGroupForm({ groupId, name }: { groupId: string; name: string }) {
  const [state, action] = useActionState(deleteGroup.bind(null, groupId), undefined);
  const [value, setValue] = useState("");
  return (
    <form action={action} className="mt-4 max-w-sm space-y-3">
      <label className="block text-xs text-mute" htmlFor="confirm-group">
        Escribe <b className="text-paper">{name}</b> para confirmar
      </label>
      <input id="confirm-group" name="confirm" value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" className={input} />
      <FormMessage state={state} />
      <SubmitButton
        pendingText="Eliminando…"
        className="inline-flex items-center justify-center rounded-xl bg-coral px-4 py-2.5 font-semibold text-ink transition hover:bg-coral/90 disabled:opacity-40"
      >
        Eliminar el grupo
      </SubmitButton>
    </form>
  );
}
