"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/ui/Form";
import { btnPrimary, input } from "@/components/ui/styles";
import { formatDateLong, statementForCharge, today } from "@/lib/domain";
import { saveCard } from "@/lib/groups/actions";

interface Props {
  groupId: string;
  members: { id: string; name: string }[];
  card?: { id: string; name: string; last4: string | null; holderId: string; cutoffDay: number; dueDays: number };
}

export function CardForm({ groupId, members, card }: Props) {
  const [state, action] = useActionState(saveCard.bind(null, groupId, card?.id ?? null), undefined);
  const [cutoffDay, setCutoffDay] = useState(card?.cutoffDay ?? 5);
  const [dueDays, setDueDays] = useState(card?.dueDays ?? 20);

  let preview: string | null = null;
  try {
    const st = statementForCharge(today(), { cutoffDay, dueDays });
    preview = `Lo que compren hoy entra al corte del ${formatDateLong(st.cutoff, { year: false })} y se paga antes del ${formatDateLong(st.dueDate, { year: false })}.`;
  } catch {
    preview = null;
  }

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <Field label="Nombre">
          <input name="name" required defaultValue={card?.name} placeholder="Tarjeta de Perla" className={input} />
        </Field>
        <Field label="Últimos 4 (opcional)">
          <input name="last4" inputMode="numeric" maxLength={4} pattern="\d{4}" defaultValue={card?.last4 ?? ""} placeholder="4821" className={`${input} tabular`} />
        </Field>
      </div>
      <Field label="Titular (a quien se le deposita)">
        <select name="holderId" required defaultValue={card?.holderId ?? ""} className={input}>
          <option value="" disabled>
            Elige a la persona
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Día de corte" hint="Viene en el estado de cuenta">
          <input name="cutoffDay" type="number" min={1} max={31} required value={cutoffDay} onChange={(e) => setCutoffDay(Number(e.target.value))} className={input} />
        </Field>
        <Field label="Días para pagar" hint="Del corte a la fecha límite">
          <input name="dueDays" type="number" min={1} max={60} required value={dueDays} onChange={(e) => setDueDays(Number(e.target.value))} className={input} />
        </Field>
      </div>
      {preview && <p className="rounded-xl bg-ink px-3 py-2 text-sm text-mute">{preview}</p>}
      <FormMessage state={state} />
      <SubmitButton className={`${btnPrimary} w-full`}>{card ? "Guardar cambios" : "Agregar tarjeta"}</SubmitButton>
    </form>
  );
}
