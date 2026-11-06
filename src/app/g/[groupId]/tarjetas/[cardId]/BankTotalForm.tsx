"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/ui/Form";
import { input } from "@/components/ui/styles";
import { setBankTotal } from "@/lib/groups/actions";

export function BankTotalForm({ groupId, cardId, cutoff, bankTotal }: { groupId: string; cardId: string; cutoff: string; bankTotal: number | null }) {
  const [state, action] = useActionState(setBankTotal.bind(null, groupId, cardId), undefined);
  return (
    <form action={action} className="mt-3" key={cutoff}>
      <input type="hidden" name="cutoff" value={cutoff} />
      <label className="text-xs text-mute" htmlFor={`bank-${cutoff}`}>
        Total del estado de cuenta del banco
      </label>
      <div className="mt-1 flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute">$</span>
          <input
            id={`bank-${cutoff}`}
            name="bankTotal"
            inputMode="decimal"
            defaultValue={bankTotal !== null ? (bankTotal / 100).toFixed(2) : ""}
            placeholder="Para comparar"
            className={`${input} tabular py-2 pl-7 text-sm`}
          />
        </div>
        <SubmitButton pendingText="…" className="rounded-xl border border-line bg-slate px-3 text-sm font-medium hover:border-mute/60">
          Guardar
        </SubmitButton>
      </div>
      {state?.error && <FormMessage state={state} />}
    </form>
  );
}
