"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { FormMessage, SubmitButton } from "@/components/ui/Form";
import { btnPrimary, btnSecondary, input } from "@/components/ui/styles";
import { addMember, renameMember } from "@/lib/groups/actions";

export function AddMemberForm({ groupId }: { groupId: string }) {
  const [state, action] = useActionState(addMember.bind(null, groupId), undefined);
  return (
    <form action={action} className="space-y-3">
      <div className="flex gap-2">
        <input name="name" required maxLength={60} placeholder="Nombre, ej. Mamá" className={input} aria-label="Nombre" />
        <SubmitButton className={btnPrimary} pendingText="…">
          Agregar
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function RenameForm({ groupId, memberId, name }: { groupId: string; memberId: string; name: string }) {
  const [state, action] = useActionState(renameMember.bind(null, groupId, memberId), undefined);
  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <input name="name" required maxLength={60} defaultValue={name} className={input} aria-label="Nombre" />
        <SubmitButton className={btnSecondary} pendingText="…">
          Guardar
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

const noop = () => () => {};

export function CopyInvite({ code }: { code: string }) {
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => "");
  const link = `${origin}/unirse/${code}`;
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4 space-y-3">
      <p className="rounded-2xl bg-ink py-4 text-center font-display text-3xl font-bold tracking-[0.3em] text-lime">{code}</p>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        }}
        className={`${btnSecondary} w-full text-sm`}
      >
        {copied ? "¡Link copiado!" : "Copiar link de invitación"}
      </button>
      {origin && <p className="break-all text-center text-xs text-mute">{link}</p>}
    </div>
  );
}
