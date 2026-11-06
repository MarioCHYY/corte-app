import type { Metadata } from "next";
import Link from "next/link";
import { DateText, KIND_LABEL, Money } from "@/components/display";
import { card as cardCls } from "@/components/ui/styles";
import { formatDateLong, statementForCharge } from "@/lib/domain";
import { deletePayment } from "@/lib/groups/actions";
import { loadGroup } from "@/lib/groups/data";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Movimientos" };

export default async function MovementsPage({ params, searchParams }: PageProps<"/g/[groupId]/movimientos">) {
  const { groupId } = await params;
  const { ver } = await searchParams;
  const data = await loadGroup(groupId);
  const base = `/g/${groupId}`;
  const filter = ver === "gastos" || ver === "pagos" ? ver : "todo";

  type Item = { kind: "expense"; date: string; id: string; created: number } | { kind: "payment"; date: string; id: string; created: number };
  const items: Item[] = [
    ...(filter !== "pagos" ? data.expenses.map((e) => ({ kind: "expense" as const, date: e.date, id: e.id, created: e.createdAt.getTime() })) : []),
    ...(filter !== "gastos" ? data.payments.map((p) => ({ kind: "payment" as const, date: p.date, id: p.id, created: p.createdAt.getTime() })) : []),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.created - a.created));

  // Agrupar por mes
  const byMonth = new Map<string, Item[]>();
  for (const it of items) {
    const key = it.date.slice(0, 7);
    byMonth.set(key, [...(byMonth.get(key) ?? []), it]);
  }
  const cardById = new Map(data.cards.map((c) => [c.id, c]));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Movimientos</h1>
        <div className="flex gap-1">
          {(
            [
              ["todo", "Todo"],
              ["gastos", "Gastos"],
              ["pagos", "Pagos"],
            ] as const
          ).map(([v, l]) => (
            <Link
              key={v}
              href={v === "todo" ? `${base}/movimientos` : `${base}/movimientos?ver=${v}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${filter === v ? "bg-lime text-ink" : "bg-slate text-paper/80 hover:bg-line"}`}
            >
              {l}
            </Link>
          ))}
        </div>
      </div>

      {items.length === 0 && <p className={`${cardCls} mt-6 p-6 text-mute`}>Todavía no hay movimientos.</p>}

      {[...byMonth].map(([month, list]) => (
        <section key={month} className="mt-6">
          <h2 className="text-sm font-semibold capitalize text-mute">{formatDateLong(`${month}-01`).replace(/^1 de /, "")}</h2>
          <ul className={`${cardCls} mt-2 divide-y divide-line`}>
            {list.map((it) => {
              if (it.kind === "expense") {
                const e = data.expenses.find((x) => x.id === it.id)!;
                const c = e.cardId ? cardById.get(e.cardId) : null;
                const st = c ? statementForCharge(e.date, { cutoffDay: c.cutoffDay, dueDays: c.dueDays }) : null;
                const who = e.kind === "shared" ? (e.shares.length === data.members.length ? "entre todos" : e.shares.map((s) => data.memberName(s.memberId)).join(", ")) : data.memberName(e.shares[0]?.memberId);
                return (
                  <li key={it.id}>
                    <Link href={`${base}/gastos/${e.id}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate/50">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate text-paper/80">
                        <Icon name={e.kind === "gift" ? "gift" : c ? "card" : "cash"} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {e.description}
                          {e.installments > 1 && <span className="text-mute"> · {e.installments} MSI</span>}
                        </p>
                        <p className="truncate text-xs text-mute">
                          <DateText date={e.date} /> · {KIND_LABEL[e.kind]} {e.kind === "gift" && e.giftFor ? `para ${e.giftFor} ` : ""}· {e.kind === "gift" ? "lo regala " : ""}
                          {who}
                        </p>
                        <p className="truncate text-xs text-mute">
                          {c ? (
                            <>
                              {c.name} · corte del <DateText date={st!.cutoff} />
                            </>
                          ) : (
                            <>Lo pagó {data.memberName(e.paidById)}</>
                          )}
                        </p>
                      </div>
                      <Money cents={e.amount} className="font-display font-bold" />
                    </Link>
                  </li>
                );
              }
              const p = data.payments.find((x) => x.id === it.id)!;
              return (
                <li key={it.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime/15 text-lime">
                    <Icon name="arrowUpRight" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {data.memberName(p.fromId)} le pagó a {data.memberName(p.toId)}
                    </p>
                    <p className="truncate text-xs text-mute">
                      <DateText date={p.date} />
                      {p.cardId && p.cutoff && (
                        <>
                          {" "}
                          · {cardById.get(p.cardId)?.name} corte del <DateText date={p.cutoff} />
                        </>
                      )}
                      {p.note && ` · ${p.note}`}
                    </p>
                  </div>
                  <Money cents={p.amount} className="font-display font-bold text-lime" />
                  <form action={deletePayment.bind(null, groupId, p.id)}>
                    <button className="rounded-lg px-2 py-1 text-xs text-mute hover:bg-coral/10 hover:text-coral">Borrar</button>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
