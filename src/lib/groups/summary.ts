import "server-only";
import {
  balances,
  currentStatement,
  daysBetween,
  shiftCutoff,
  simplifyDebts,
  statementSummary,
  upcomingStatements,
  type ISODate,
  type StatementSummary,
} from "@/lib/domain";
import { toDomainCard, type CardRow, type GroupData } from "./data";

export interface CardStatus {
  card: CardRow;
  summary: StatementSummary;
  bankTotal: number | null;
  daysLeft: number;
  /** El corte ya cerró (estamos entre el corte y la fecha límite). */
  closed: boolean;
}

export function cardStatus(data: GroupData, card: CardRow, cutoff?: ISODate): CardStatus {
  const dc = toDomainCard(card);
  const c = cutoff ?? currentStatement(data.today, dc.cycle).cutoff;
  const summary = statementSummary({ card: dc, cutoff: c, expenses: data.domain.expenses, payments: data.domain.payments });
  return {
    card,
    summary,
    bankTotal: data.bankTotals.get(`${card.id}|${c}`) ?? null,
    daysLeft: daysBetween(data.today, summary.statement.dueDate),
    closed: data.today >= c,
  };
}

/** Saldos del grupo: las compras con tarjeta cuentan cuando ya llegó su corte. */
export function groupBalances(data: GroupData) {
  const bal = balances({ ...data.domain, asOf: data.today });
  const rows = data.members.map((m) => ({ member: m, balance: bal.get(m.id) ?? 0 }));
  return { rows, transfers: simplifyDebts(bal) };
}

/** Lo que le toca a una persona en los próximos cortes de todas las tarjetas. */
export function upcomingFor(data: GroupData, memberId: string, months = 6) {
  const out: { cardId: string; cardName: string; cutoff: ISODate; dueDate: ISODate; amount: number }[] = [];
  for (const card of data.cards.filter((c) => !c.archived)) {
    const dc = toDomainCard(card);
    const cur = currentStatement(data.today, dc.cycle);
    for (const st of upcomingStatements(shiftCutoff(cur.cutoff, 1, dc.cycle.cutoffDay), dc.cycle, months)) {
      const s = statementSummary({ card: dc, cutoff: st.cutoff, expenses: data.domain.expenses, payments: [] });
      const me = s.people.find((p) => p.userId === memberId);
      out.push({ cardId: card.id, cardName: card.name, cutoff: st.cutoff, dueDate: st.dueDate, amount: me?.owed ?? 0 });
    }
  }
  return out.sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0));
}
