"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/ui/Form";
import { btnPrimary, input } from "@/components/ui/styles";
import { formatDateLong } from "@/lib/domain";
import { createPayment } from "@/lib/groups/actions";

interface Props {
  groupId: string;
  members: { id: string; name: string }[];
  cards: { id: string; name: string; holderId: string; cutoff: string }[];
  defaultFrom?: string;
  /** Pago fijo para un corte (desde la pantalla de la tarjeta) */
  fixed?: { cardId: string; cutoff: string; toId: string };
  defaultAmount?: string;
  today: string;
}

export function PaymentForm({ groupId, members, cards, defaultFrom, fixed, defaultAmount, today }: Props) {
  const [state, action] = useActionState(createPayment.bind(null, groupId), undefined);
  const [cardId, setCardId] = useState(fixed?.cardId ?? "");
  const card = cards.find((c) => c.id === cardId);
  const [from, setFrom] = useState(defaultFrom ?? members[0]?.id ?? "");
  const [to, setTo] = useState(fixed?.toId ?? card?.holderId ?? members.find((m) => m.id !== defaultFrom)?.id ?? "");
  return (
    <form action={action} className="space-y-3">
      {fixed ? (
        <>
          <input type="hidden" name="cardId" value={fixed.cardId} />
          <input type="hidden" name="cutoff" value={fixed.cutoff} />
          <input type="hidden" name="toId" value={fixed.toId} />
        </>
      ) : (
        cards.length > 0 && (
          <Field label="¿Es para pagar un corte de tarjeta?">
            <select
              name="cardId"
              value={cardId}
              onChange={(e) => {
                setCardId(e.target.value);
                const c = cards.find((x) => x.id === e.target.value);
                if (c) setTo(c.holderId);
              }}
              className={input}
            >
              <option value="">No, es un pago entre personas</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · corte del {formatDateLong(c.cutoff, { year: false })}
                </option>
              ))}
            </select>
            {card && <input type="hidden" name="cutoff" value={card.cutoff} />}
          </Field>
        )
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quién pagó">
          <select name="fromId" value={from} onChange={(e) => setFrom(e.target.value)} className={input}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        {!fixed && (
          <Field label="A quién">
            <select name="toId" value={to} onChange={(e) => setTo(e.target.value)} className={input} disabled={!!card}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {card && <input type="hidden" name="toId" value={to} />}
          </Field>
        )}
        <Field label="Monto">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute">$</span>
            <input name="amount" inputMode="decimal" required defaultValue={defaultAmount} placeholder="0.00" className={`${input} tabular pl-7`} />
          </div>
        </Field>
        <Field label="Fecha">
          <input name="date" type="date" required defaultValue={today} className={input} />
        </Field>
      </div>
      <FormMessage state={state} />
      <SubmitButton className={`${btnPrimary} w-full`}>Registrar pago</SubmitButton>
    </form>
  );
}
