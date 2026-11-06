import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, DateText, daysLabel, KIND_LABEL, Money, Progress } from "@/components/display";
import { btnGhost, card as cardCls } from "@/components/ui/styles";
import { currentStatement, formatMXN, shiftCutoff, statementFor } from "@/lib/domain";
import { deletePayment } from "@/lib/groups/actions";
import { loadGroup, toDomainCard } from "@/lib/groups/data";
import { cardStatus } from "@/lib/groups/summary";
import { PaymentForm } from "../../PaymentForm";
import { CardForm } from "../CardForm";
import { BankTotalForm } from "./BankTotalForm";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Estado de cuenta" };

export default async function CardStatementPage({ params, searchParams }: PageProps<"/g/[groupId]/tarjetas/[cardId]">) {
  const { groupId, cardId } = await params;
  const { corte } = await searchParams;
  const data = await loadGroup(groupId);
  const card = data.cards.find((c) => c.id === cardId);
  if (!card) notFound();

  const dc = toDomainCard(card);
  const current = currentStatement(data.today, dc.cycle).cutoff;
  // Normaliza el corte pedido al día de corte de la tarjeta
  let cutoff = current;
  if (typeof corte === "string" && /^\d{4}-\d{2}-\d{2}$/.test(corte)) {
    try {
      cutoff = shiftCutoff(corte, 0, card.cutoffDay);
    } catch {
      cutoff = current;
    }
  }
  const { summary, bankTotal, daysLeft, closed } = cardStatus(data, card, cutoff);
  const prev = shiftCutoff(cutoff, -1, card.cutoffDay);
  const next = shiftCutoff(cutoff, 1, card.cutoffDay);
  const base = `/g/${groupId}/tarjetas/${cardId}`;
  const holderName = data.memberName(card.holderId);
  const others = summary.people.filter((p) => !p.isHolder);
  const owedToHolder = others.reduce((a, p) => a + p.owed, 0);
  const collected = owedToHolder - summary.pendingToHolder;
  const isPast = daysLeft < 0;
  const diff = bankTotal !== null ? bankTotal - summary.total : null;
  const payments = data.payments.filter((p) => p.cardId === cardId && p.cutoff === cutoff);
  const st = statementFor(cutoff, dc.cycle);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`/g/${groupId}/tarjetas`} className="text-sm text-mute hover:text-paper">
            <span className="inline-flex items-center gap-1">
              <Icon name="chevronLeft" className="h-4 w-4" /> Tarjetas
            </span>
          </Link>
          <h1 className="font-display text-2xl font-bold">
            {card.name} {card.last4 && <span className="text-mute">•••• {card.last4}</span>}
          </h1>
          <p className="text-sm text-mute">
            Titular: {holderName} · corte el día {card.cutoffDay} · {card.dueDays} días para pagar
          </p>
        </div>
      </div>

      {/* Navegación de cortes */}
      <div className={`${cardCls} flex items-center gap-2 p-2`}>
        <Link href={`${base}?corte=${prev}`} className={btnGhost} aria-label="Corte anterior">
          <Icon name="arrowLeft" />
        </Link>
        <div className="flex-1 text-center">
          <p className="font-display text-lg font-bold">
            Corte del <DateText date={cutoff} year />
          </p>
          <p className="text-xs text-mute">
            Compras del <DateText date={st.periodStart} /> al <DateText date={st.cutoff} />
            {cutoff === current && <span className="ml-1 rounded-full bg-lime/15 px-2 py-0.5 text-lime">actual</span>}
          </p>
        </div>
        <Link href={`${base}?corte=${next}`} className={btnGhost} aria-label="Corte siguiente">
          <Icon name="arrowRight" />
        </Link>
      </div>

      {/* Resumen del corte */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className={`${cardCls} p-5`}>
          <p className="text-sm text-mute">Fecha límite para no generar intereses</p>
          <p className="mt-1 font-display text-2xl font-bold">
            <DateText date={summary.statement.dueDate} />
          </p>
          <p className={`text-sm ${daysLeft <= 5 && !isPast ? "text-coral" : "text-mute"}`}>
            {isPast ? "Ya pasó" : daysLabel(daysLeft)}
            {!closed && " · el corte sigue abierto"}
          </p>
        </div>
        <div className={`${cardCls} p-5`}>
          <p className="text-sm text-mute">Total registrado en este corte</p>
          <p className="mt-1 font-display text-2xl font-bold">
            <Money cents={summary.total} />
          </p>
          <BankTotalForm groupId={groupId} cardId={cardId} cutoff={cutoff} bankTotal={bankTotal} />
          {diff !== null && diff !== 0 && (
            <p className="mt-2 text-sm text-coral">
              {diff > 0
                ? `El banco cobra ${formatMXN(diff)} más de lo registrado: falta registrar algo.`
                : `Hay ${formatMXN(-diff)} registrados de más: revisa si algo está duplicado.`}
            </p>
          )}
          {diff === 0 && <p className="mt-2 text-sm text-lime">Cuadra con el estado de cuenta.</p>}
        </div>
        <div className={`${cardCls} p-5`}>
          <p className="text-sm text-mute">Le falta recibir a {holderName}</p>
          <p className={`mt-1 font-display text-2xl font-bold ${summary.pendingToHolder ? "text-coral" : "text-lime"}`}>
            <Money cents={summary.pendingToHolder} />
          </p>
          <p className="text-sm text-mute">
            Lleva <Money cents={collected} /> de <Money cents={owedToHolder} />
          </p>
          <div className="mt-3">
            <Progress value={collected} max={owedToHolder} />
          </div>
        </div>
      </section>

      {summary.pendingToHolder > 0 && closed && !isPast && (
        <p className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          Si {formatMXN(summary.pendingToHolder)} no le llegan a {holderName} antes del <DateText date={summary.statement.dueDate} />, el banco
          le va a cobrar intereses sobre lo que falte.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Por persona */}
        <section>
          <h2 className="font-display text-xl font-bold">Lo que le toca a cada quien</h2>
          {summary.people.length === 0 ? (
            <p className={`${cardCls} mt-3 p-6 text-mute`}>No hay cargos en este corte.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {summary.people.map((p) => (
                <li key={p.userId} className={cardCls}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                      <Avatar id={p.userId} name={data.memberName(p.userId)} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {data.memberName(p.userId)}
                          {p.isHolder && <span className="ml-2 rounded-full bg-slate px-2 py-0.5 text-xs text-mute">titular</span>}
                        </p>
                        <p className="text-xs text-mute">
                          {p.lines.length} {p.lines.length === 1 ? "cargo" : "cargos"}
                          {p.paid > 0 && (
                            <>
                              {" "}
                              · ya dio <Money cents={p.paid} />
                            </>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <Money cents={p.owed} className="font-display font-bold" />
                        <p className={`text-xs font-medium ${p.isHolder ? "text-mute" : p.pending ? "text-coral" : "text-lime"}`}>
                          {p.isHolder ? "es su tarjeta" : p.pending ? <>debe <Money cents={p.pending} /></> : "pagado"}
                        </p>
                      </div>
                      <Icon name="chevronRight" className="h-4 w-4 text-mute transition group-open:rotate-90" />
                    </summary>
                    <ul className="border-t border-line px-4 py-2">
                      {p.lines.map((l) => {
                        const exp = data.expenses.find((e) => e.id === l.expenseId);
                        return (
                          <li key={l.expenseId} className="flex items-center justify-between gap-3 py-2 text-sm">
                            <Link href={`/g/${groupId}/gastos/${l.expenseId}`} className="min-w-0 hover:text-lime">
                              <span className="block truncate">
                                {l.description}
                                {l.installment && (
                                  <span className="text-mute">
                                    {" "}
                                    · mensualidad {l.installment.number}/{l.installment.of}
                                  </span>
                                )}
                              </span>
                              <span className="block text-xs text-mute">
                                <DateText date={l.date} />
                                {exp && ` · ${KIND_LABEL[exp.kind]}`}
                                {exp?.giftFor && ` para ${exp.giftFor}`}
                              </span>
                            </Link>
                            <Money cents={l.amount} />
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Pagos de este corte */}
        <section className="space-y-4">
          <div className={`${cardCls} p-5`}>
            <h2 className="font-display text-lg font-bold">Registrar depósito a {holderName}</h2>
            <div className="mt-4">
              {others.length === 0 ? (
                <p className="text-sm text-mute">Nadie más tiene cargos en este corte.</p>
              ) : (
                <PaymentForm
                  groupId={groupId}
                  members={others.map((p) => ({ id: p.userId, name: data.memberName(p.userId) }))}
                  cards={[]}
                  fixed={{ cardId, cutoff, toId: card.holderId }}
                  defaultFrom={others.find((p) => p.userId === data.me.id)?.userId ?? others.find((p) => p.pending > 0)?.userId}
                  today={data.today}
                />
              )}
            </div>
          </div>
          <div className={`${cardCls} p-5`}>
            <h2 className="font-display text-lg font-bold">Depósitos de este corte</h2>
            {payments.length === 0 ? (
              <p className="mt-2 text-sm text-mute">Todavía nadie ha depositado.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <div className="flex-1">
                      <b>{data.memberName(p.fromId)}</b>
                      <span className="block text-xs text-mute">
                        <DateText date={p.date} />
                        {p.note && ` · ${p.note}`}
                      </span>
                    </div>
                    <Money cents={p.amount} className="font-semibold text-lime" />
                    <form action={deletePayment.bind(null, groupId, p.id)}>
                      <button className="rounded-lg px-2 py-1 text-xs text-mute hover:bg-coral/10 hover:text-coral" aria-label="Borrar pago">
                        Borrar
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <details className={`${cardCls} p-5`}>
            <summary className="cursor-pointer font-display text-lg font-bold">Editar tarjeta</summary>
            <div className="mt-4">
              <CardForm groupId={groupId} members={data.members.map((m) => ({ id: m.id, name: m.name }))} card={card} />
            </div>
          </details>
        </section>
      </div>
    </div>
  );
}
