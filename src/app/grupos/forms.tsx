"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/ui/Form";
import { btnPrimary, input } from "@/components/ui/styles";
import { createGroup, goToInvite } from "@/lib/groups/actions";

export function CreateGroupForm({ defaultName }: { defaultName: string }) {
  const [state, action] = useActionState(createGroup, undefined);
  return (
    <form action={action} className="mt-4 space-y-3">
      <Field label="Nombre del grupo">
        <input name="name" required placeholder="Casa, Depa, Viaje a Mazunte…" className={input} />
      </Field>
      <Field label="Tu nombre en el grupo">
        <input name="myName" required defaultValue={defaultName} className={input} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className={`${btnPrimary} w-full`} pendingText="Creando…">
        Crear grupo
      </SubmitButton>
    </form>
  );
}

export function JoinByCodeForm() {
  const [state, action] = useActionState(goToInvite, undefined);
  return (
    <form action={action} className="mt-4 space-y-3">
      <Field label="Código">
        <input
          name="code"
          required
          placeholder="K7M3QX"
          autoCapitalize="characters"
          className={`${input} font-display text-lg uppercase tracking-[0.3em]`}
        />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className={`${btnPrimary} w-full`} pendingText="Buscando…">
        Continuar
      </SubmitButton>
    </form>
  );
}
