"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/ui/Form";
import { btnPrimary, input } from "@/components/ui/styles";
import { joinGroup } from "@/lib/groups/actions";

export function JoinForm({
  code,
  defaultName,
  free,
  taken,
}: {
  code: string;
  defaultName: string;
  free: { id: string; name: string }[];
  taken: string[];
}) {
  const [state, action] = useActionState(joinGroup.bind(null, code), undefined);
  const [choice, setChoice] = useState<string>(free.length ? "" : "new");

  return (
    <form action={action} className="mt-6 space-y-4">
      {free.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium">¿Quién eres?</legend>
          <p className="text-xs text-mute">Si ya te habían agregado, elige tu nombre para ver tus cuentas.</p>
          <div className="mt-3 grid gap-2">
            {free.map((p) => (
              <label
                key={p.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                  choice === p.id ? "border-lime bg-lime/10" : "border-line hover:border-mute/60"
                }`}
              >
                <input type="radio" required name="memberId" value={p.id} checked={choice === p.id} onChange={() => setChoice(p.id)} className="accent-lime" />
                {p.name}
              </label>
            ))}
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                choice === "new" ? "border-lime bg-lime/10" : "border-line hover:border-mute/60"
              }`}
            >
              <input type="radio" name="memberId" value="new" checked={choice === "new"} onChange={() => setChoice("new")} className="accent-lime" />
              No estoy en la lista
            </label>
          </div>
        </fieldset>
      )}
      {choice === "new" && (
        <>
          {free.length === 0 && <input type="hidden" name="memberId" value="new" />}
          <Field label="Tu nombre en el grupo">
            <input name="newName" required defaultValue={defaultName} className={input} />
          </Field>
        </>
      )}
      {taken.length > 0 && <p className="text-xs text-mute">Ya están: {taken.join(", ")}</p>}
      <FormMessage state={state} />
      <SubmitButton className={`${btnPrimary} w-full`} pendingText="Uniéndome…">
        Unirme al grupo
      </SubmitButton>
    </form>
  );
}
