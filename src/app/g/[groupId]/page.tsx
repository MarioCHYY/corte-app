import Link from "next/link";
import { Avatar, DateText, daysLabel, Money, Progress } from "@/components/display";
import { btnPrimary, btnSecondary, card } from "@/components/ui/styles";
import { loadGroup } from "@/lib/groups/data";
import { cardStatus, groupBalances, upcomingFor } from "@/lib/groups/summary";
import { PaymentForm } from "./PaymentForm";

export default async function GroupHome({ params }: PageProps<"/g/[groupId]">) {
  const { groupId } = await params;
  const data = await loadGroup(groupId);
  const base = `/g/${groupId}`;
  const statuses = data.cards.filter((c) => !c.archived).map((c) => cardStatus(data, c));
  const { rows, transfers } = groupBalances(data);
  const upcoming = upcomingFor(data, data.me.id).filter((u) => u.amount > 0);
  const empty = data.expenses.length === 0;

  return (
    <div className="space-y-8">
      {empty && (
        <section className={`${card} p-6`}>
          <h1 className="font-display text-2xl font-bold">Empecemos</h1>
          <ol className="mt-3 space-y-2 text-paper/80">
            <li>
              1. Agrega a las personas de tu grupo en{" "}
              <Link className="text-lime hover:underline" href={`${base}/personas`}>
                Personas
              </Link>
              .
            </li>
            <li>
              2. Si usan una tarjeta compartida, dala de alta en{" "}
              <Link className="text-lime hover:underline" href={`${base}/tarjetas`}>
                Tarjetas
              </Link>{" "}
              con su día de corte.
            </li>
            <li>3. Registra los gastos y corte acomoda todo solo.</li>
          </ol>
          <Link href={`${base}/gastos/nuevo`} className={`${btnPrimary} mt-5`}>
            Agregar el primer gasto
          </Link>
        </section>
      )}

      {/* ---------- Este corte ---------- */}
      {statuses.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold">Este corte</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {statuses.map(({ card: c, summary, daysLeft, closed }) => {
              const iAmHolder = c.holderId === data.me.id;
              const mine = summary.people.find((p) => p.userId === data.me.id);
              const others = summary.people.filter((p) => !p.isHolder);
              const owedToHolder = others.reduce((a, p) => a + p.owed, 0);
              const collected = owedToHolder - summary.pendingToHolder;
              const urgent = daysLeft <= 5;
              return (
                <article key={c.id} className={`${card} p-5`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-sm text-mute">
                        Corte del <DateText date={summary.statement.cutoff} /> {closed ? "(ya cerró)" : "(abierto)"}
                      </p>
                    </div>
                    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${urgent ? "bg-coral/15 text-coral" : "bg-slate text-mute"}`}>
                      {daysLabel(daysLeft)}
                    </span>
                  </div>

                  {iAmHolder ? (
                    <>
                      <p className="mt-4 text-sm text-mute">Te tienen que depositar</p>
                      <p className="font-display text-3xl font-bold">
                        <Money cents={summary.pendingToHolder} className={summary.pendingToHolder ? "text-coral" : "text-lime"} />
                      </p>
                      <p className="text-sm text-mute">
                        antes del <DateText date={summary.statement.dueDate} /> · llevas <Money cents={collected} /> de <Money cents={owedToHolder} />
                      </p>
                      <div className="mt-3">
                        <Progress value={collected} max={owedToHolder} />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mt-4 text-sm text-mute">Le debes a {data.memberName(c.holderId)}</p>
                      <p className="font-display text-3xl font-bold">
                        <Money cents={mine?.pending ?? 0} className={mine?.pending ? "text-paper" : "text-lime"} />
                      </p>
                      <p className="text-sm text-mute">
                        {mine?.pending ? (
                          <>
                            antes del <DateText date={summary.statement.dueDate} />
                            {mine.paid > 0 && (
                              <>
                                {" "}
                                · ya diste <Money cents={mine.paid} />
                              </>
                            )}
                          </>
                        ) : mine?.owed ? (
                          "Ya quedaste. ¡Bien!"
                        ) : (
                          "No tienes cargos en este corte"
                        )}
                      </p>
                    </>
                  )}
                  <Link href={`${base}/tarjetas/${c.id}`} className={`${btnSecondary} mt-4 w-full text-sm`}>
                    Ver detalle del corte
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        {/* ---------- Saldos ---------- */}
        <section>
          <h2 className="font-display text-xl font-bold">Saldos del grupo</h2>
          <p className="text-sm text-mute">Incluye gastos en efectivo y los cortes de tarjeta que ya cerraron.</p>
          <ul className={`${card} mt-3 divide-y divide-line`}>
            {rows.map(({ member, balance }) => (
              <li key={member.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar id={member.id} name={member.name} />
                <span className="flex-1 font-medium">
                  {member.name}
                  {member.id === data.me.id && <span className="text-mute"> (tú)</span>}
                </span>
                <span className="text-right text-sm">
                  <Money cents={balance} sign className={`font-semibold ${balance > 0 ? "text-lime" : balance < 0 ? "text-coral" : "text-mute"}`} />
                  <span className="block text-xs text-mute">{balance > 0 ? "le deben" : balance < 0 ? "debe" : "a mano"}</span>
                </span>
              </li>
            ))}
          </ul>
          {transfers.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Para quedar a mano</h3>
              <ul className="mt-2 space-y-2">
                {transfers.map((t, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-xl bg-slate-2 px-4 py-2.5 text-sm">
                    <b>{data.memberName(t.from)}</b>
                    <span className="text-mute">le paga a</span>
                    <b>{data.memberName(t.to)}</b>
                    <Money cents={t.amount} className="ml-auto font-semibold" />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ---------- Registrar pago + próximos ---------- */}
        <div className="space-y-8">
          <section>
            <h2 className="font-display text-xl font-bold">Registrar un pago</h2>
            <p className="text-sm text-mute">Cuando alguien le da dinero a otra persona del grupo.</p>
            <div className={`${card} mt-3 p-5`}>
              <PaymentForm
                groupId={groupId}
                members={data.members.map((m) => ({ id: m.id, name: m.name }))}
                cards={statuses.map((s) => ({ id: s.card.id, name: s.card.name, holderId: s.card.holderId, cutoff: s.summary.statement.cutoff }))}
                defaultFrom={data.me.id}
                today={data.today}
              />
            </div>
          </section>

          {upcoming.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold">Lo que viene para ti</h2>
              <p className="text-sm text-mute">Mensualidades y cargos en los próximos cortes.</p>
              <ul className={`${card} mt-3 divide-y divide-line`}>
                {upcoming.map((u) => (
                  <li key={u.cardId + u.cutoff} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <Link href={`${base}/tarjetas/${u.cardId}?corte=${u.cutoff}`} className="hover:text-lime">
                      Pagar antes del <DateText date={u.dueDate} />
                      <span className="block text-xs text-mute">{u.cardName}</span>
                    </Link>
                    <Money cents={u.amount} className="font-semibold" />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
