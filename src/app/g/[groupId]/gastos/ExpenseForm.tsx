"use client";

import { useActionState, useState } from "react";
import { Avatar } from "@/components/display";
import { Field, FormMessage, SubmitButton } from "@/components/ui/Form";
import { btnPrimary, chip, input, label } from "@/components/ui/styles";
import { formatDateLong, formatMXN, installmentSchedule, today as todayFn } from "@/lib/domain";
import { saveExpense } from "@/lib/groups/actions";
import { computeShares, expenseInputSchema, type ExpenseInput } from "@/lib/groups/validation";
import { Icon } from "@/components/icons";

type Kind = "shared" | "personal" | "gift";
type Mode = "equal" | "exact" | "percent";

export interface ExpenseFormInitial {
  description: string;
  amount: string;
  date: string;
  kind: Kind;
  paidType: "card" | "member";
  cardId: string;
  paidById: string;
  installments: number;
  giftFor: string;
  mode: Mode;
  memberIds: string[];
  single: string;
  exact: Record<string, string>;
  percents: Record<string, string>;
}

interface Props {
  groupId: string;
  expenseId?: string;
  meId: string;
  members: { id: string; name: string }[];
  cards: { id: string; name: string; cutoffDay: number; dueDays: number; holderName: string }[];
  initial?: ExpenseFormInitial;
  returnTo: string;
}

const MSI = [1, 3, 6, 9, 12, 18, 24];
const KINDS: { value: Kind; label: string; hint: string }[] = [
  { value: "shared", label: "Compartido", hint: "Luz, súper, internet…" },
  { value: "personal", label: "Personal", hint: "Le toca a una persona" },
  { value: "gift", label: "Regalo", hint: "Lo paga quien regala" },
];

export function ExpenseForm({ groupId, expenseId, meId, members, cards, initial, returnTo }: Props) {
  const [state, action] = useActionState(saveExpense.bind(null, groupId, expenseId ?? null), undefined);
  const allIds = members.map((m) => m.id);

  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [date, setDate] = useState(initial?.date ?? todayFn());
  const [kind, setKind] = useState<Kind>(initial?.kind ?? "shared");
  const [paidType, setPaidType] = useState<"card" | "member">(initial?.paidType ?? (cards.length ? "card" : "member"));
  const [cardId, setCardId] = useState(initial?.cardId ?? cards[0]?.id ?? "");
  const [paidById, setPaidById] = useState(initial?.paidById ?? meId);
  const [installments, setInstallments] = useState(initial?.installments ?? 1);
  const [giftFor, setGiftFor] = useState(initial?.giftFor ?? "");
  const [mode, setMode] = useState<Mode>(initial?.mode ?? "equal");
  const [memberIds, setMemberIds] = useState<string[]>(initial?.memberIds ?? allIds);
  const [single, setSingle] = useState(initial?.single ?? meId);
  const [exact, setExact] = useState<Record<string, string>>(initial?.exact ?? {});
  const [percents, setPercents] = useState<Record<string, string>>(initial?.percents ?? {});

  const payload: ExpenseInput = {
    description,
    amount,
    date,
    kind,
    paid: paidType === "card" ? { type: "card", cardId } : { type: "member", memberId: paidById },
    installments: paidType === "card" ? installments : 1,
    giftFor: kind === "gift" ? giftFor : undefined,
    split:
      kind !== "shared"
        ? { mode: "single", memberId: single }
        : mode === "equal"
          ? { mode: "equal", memberIds: allIds.filter((id) => memberIds.includes(id)) }
          : mode === "exact"
            ? { mode: "exact", amounts: exact }
            : { mode: "percent", percents },
  };

  // Vista previa en vivo con la misma lógica que usa el servidor
  const preview = (() => {
    const parsed = expenseInputSchema.safeParse(payload);
    if (!parsed.success) return { error: amount ? parsed.error.issues[0]?.message : undefined };
    try {
      const { shares } = computeShares(parsed.data);
      const c = cards.find((x) => x.id === cardId);
      const schedule =
        paidType === "card" && c
          ? installmentSchedule({ date, total: parsed.data.amount, count: installments, shares, cycle: { cutoffDay: c.cutoffDay, dueDays: c.dueDays } })
          : null;
      return { shares, schedule, card: c };
    } catch (e) {
      return { error: (e as Error).message };
    }
  })();

  const name = (id: string) => members.find((m) => m.id === id)?.name ?? "";
  const sumExact = Object.values(exact).reduce((a, v) => a + (Number(v.replace(/[$,]/g, "")) || 0), 0);
  const sumPct = Object.values(percents).reduce((a, v) => a + (Number(v) || 0), 0);

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div className="space-y-5">
        {/* Qué y cuánto */}
        <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
          <Field label="¿Qué fue?">
            <input value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={120} placeholder="Luz, súper, audífonos…" className={input} autoFocus={!expenseId} />
          </Field>
          <Field label="Monto total">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute">$</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} required inputMode="decimal" placeholder="0.00" className={`${input} tabular pl-7 font-display text-lg`} />
            </div>
          </Field>
        </div>

        {/* Tipo */}
        <fieldset>
          <legend className={label}>Tipo de gasto</legend>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                onClick={() => setKind(k.value)}
                aria-pressed={kind === k.value}
                className={`rounded-xl border px-3 py-2.5 text-left transition ${kind === k.value ? "border-lime bg-lime/10" : "border-line hover:border-mute/60"}`}
              >
                <span className="block text-sm font-semibold">{k.label}</span>
                <span className="block text-xs text-mute">{k.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Cómo se pagó */}
        <fieldset>
          <legend className={label}>¿Cómo se pagó?</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {cards.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setPaidType("card");
                  setCardId(c.id);
                }}
                className={chip(paidType === "card" && cardId === c.id)}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="card" className="h-4 w-4" />
                  {c.name}
                </span>
              </button>
            ))}
            <button type="button" onClick={() => setPaidType("member")} className={chip(paidType === "member")}>
              Lo pagó una persona
            </button>
          </div>
          {paidType === "member" && (
            <div className="mt-3">
              <Field label="¿Quién lo pagó?" hint="En efectivo, transferencia o con su propia tarjeta">
                <select value={paidById} onChange={(e) => setPaidById(e.target.value)} className={input}>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
          {paidType === "card" && (
            <div className="mt-3">
              <span className={label}>Forma de pago</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {MSI.map((m) => (
                  <button key={m} type="button" onClick={() => setInstallments(m)} className={chip(installments === m)}>
                    {m === 1 ? "Contado" : `${m} MSI`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        <Field label="Fecha de la compra">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={`${input} sm:max-w-56`} />
        </Field>

        {/* División */}
        {kind === "shared" ? (
          <fieldset>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <legend className={label}>¿Entre quiénes?</legend>
              <div className="flex gap-1">
                {(
                  [
                    ["equal", "Igual"],
                    ["exact", "Montos"],
                    ["percent", "%"],
                  ] as const
                ).map(([m, l]) => (
                  <button key={m} type="button" onClick={() => setMode(m)} className={`${chip(mode === m)} px-2.5 py-1 text-xs`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <ul className="mt-2 divide-y divide-line rounded-2xl border border-line">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-3 py-2">
                  {mode === "equal" ? (
                    <label className="flex flex-1 cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        className="size-4 accent-lime"
                        checked={memberIds.includes(m.id)}
                        onChange={(e) => setMemberIds((ids) => (e.target.checked ? [...ids, m.id] : ids.filter((x) => x !== m.id)))}
                      />
                      <Avatar id={m.id} name={m.name} size={26} />
                      <span className="flex-1">{m.name}</span>
                    </label>
                  ) : (
                    <>
                      <Avatar id={m.id} name={m.name} size={26} />
                      <span className="flex-1">{m.name}</span>
                      <div className="relative w-32">
                        {mode === "exact" && <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-mute">$</span>}
                        <input
                          inputMode="decimal"
                          aria-label={`Parte de ${m.name}`}
                          value={(mode === "exact" ? exact : percents)[m.id] ?? ""}
                          onChange={(e) => (mode === "exact" ? setExact : setPercents)((v) => ({ ...v, [m.id]: e.target.value }))}
                          placeholder="0"
                          className={`${input} tabular py-1.5 text-right text-sm ${mode === "exact" ? "pl-6" : "pr-7"}`}
                        />
                        {mode === "percent" && <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-mute">%</span>}
                      </div>
                    </>
                  )}
                  {mode === "equal" && preview && "shares" in preview && (
                    <span className="tabular text-sm text-mute">{formatMXN(preview.shares!.find((s) => s.userId === m.id)?.amount ?? 0)}</span>
                  )}
                </li>
              ))}
            </ul>
            {mode === "exact" && <p className="mt-1.5 text-right text-xs text-mute">Suman {formatMXN(Math.round(sumExact * 100))}</p>}
            {mode === "percent" && <p className="mt-1.5 text-right text-xs text-mute">Suman {sumPct.toFixed(2).replace(/\.00$/, "")}% de 100%</p>}
          </fieldset>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={kind === "gift" ? "¿Quién lo regala?" : "¿De quién es?"} hint={kind === "gift" ? "A esa persona se le cobra" : undefined}>
              <select value={single} onChange={(e) => setSingle(e.target.value)} className={input}>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
            {kind === "gift" && (
              <Field label="¿Para quién?">
                <input value={giftFor} onChange={(e) => setGiftFor(e.target.value)} maxLength={60} placeholder="Mamá" className={input} />
              </Field>
            )}
          </div>
        )}
      </div>

      {/* Vista previa */}
      <aside className="h-fit space-y-4 rounded-3xl border border-line bg-slate-2 p-5 lg:sticky lg:top-20">
        <h2 className="font-display text-lg font-bold">Así queda</h2>
        {!preview || "error" in preview ? (
          <p className={`text-sm ${preview?.error ? "text-coral" : "text-mute"}`}>{preview?.error ?? "Escribe el monto para ver cómo se reparte."}</p>
        ) : (
          <>
            {preview.schedule && preview.card ? (
              <div className="rounded-2xl bg-ink p-4">
                <p className="text-sm text-mute">
                  Entra al corte del <b className="text-paper">{formatDateLong(preview.schedule[0].statement.cutoff, { year: false })}</b>
                </p>
                <p className="mt-1 font-display text-lg font-bold leading-snug">
                  Se le paga a {preview.card.holderName} antes del <span className="text-lime">{formatDateLong(preview.schedule[0].statement.dueDate)}</span>
                </p>
                {installments > 1 && (
                  <p className="mt-1 text-sm text-mute">
                    {installments} mensualidades de {formatMXN(preview.schedule[0].amount)}, la última el{" "}
                    {formatDateLong(preview.schedule[installments - 1].statement.dueDate)}.
                  </p>
                )}
              </div>
            ) : (
              <p className="rounded-2xl bg-ink p-4 text-sm text-mute">
                Lo pagó <b className="text-paper">{name(paidById)}</b>: los demás le deben su parte.
              </p>
            )}
            <ul className="space-y-2">
              {preview.shares!.map((s) => (
                <li key={s.userId} className="flex items-center gap-2 text-sm">
                  <Avatar id={s.userId} name={name(s.userId)} size={24} />
                  <span className="flex-1">{name(s.userId)}</span>
                  <span className="tabular font-semibold">{formatMXN(s.amount)}</span>
                  {installments > 1 && preview.schedule && (
                    <span className="tabular text-xs text-mute">({formatMXN(preview.schedule[0].shares.find((x) => x.userId === s.userId)?.amount ?? 0)}/mes)</span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
        <FormMessage state={state} />
        <SubmitButton className={`${btnPrimary} w-full`}>{expenseId ? "Guardar cambios" : "Guardar gasto"}</SubmitButton>
      </aside>
    </form>
  );
}
