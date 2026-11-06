import { statementFor, type CardCycle, type Statement } from "./billing";
import type { ISODate } from "./dates";
import { installmentSchedule } from "./installments";
import type { Cents } from "./money";
import type { Share } from "./splits";

export interface Card {
  id: string;
  holderId: string;
  cycle: CardCycle;
}

export type PaidBy = { kind: "user"; userId: string } | { kind: "card"; cardId: string };

export interface Expense {
  id: string;
  description: string;
  amount: Cents;
  date: ISODate;
  paidBy: PaidBy;
  /** 1 = contado. Solo aplica a gastos con tarjeta. */
  installments: number;
  shares: Share[];
}

export interface Payment {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: Cents;
  date: ISODate;
  /** Si el pago cubre un corte en particular. */
  cardId?: string;
  cutoff?: ISODate;
}

/** Quién puso el dinero de un gasto. */
export function creditorOf(expense: Expense, cards: Map<string, Card>): string {
  if (expense.paidBy.kind === "user") return expense.paidBy.userId;
  const card = cards.get(expense.paidBy.cardId);
  if (!card) throw new Error(`Tarjeta ${expense.paidBy.cardId} no encontrada`);
  return card.holderId;
}

// ---------------------------------------------------------------------------
// Estado de cuenta por persona
// ---------------------------------------------------------------------------

export interface StatementLine {
  expenseId: string;
  description: string;
  date: ISODate;
  installment: { number: number; of: number } | null;
  /** Lo que le toca a esta persona en este corte. */
  amount: Cents;
}

export interface PersonInStatement {
  userId: string;
  isHolder: boolean;
  owed: Cents;
  paid: Cents;
  /** Lo que le falta depositar al titular (0 para el titular). */
  pending: Cents;
  lines: StatementLine[];
}

export interface StatementSummary {
  cardId: string;
  statement: Statement;
  /** Total registrado en la app para este corte. */
  total: Cents;
  people: PersonInStatement[];
  /** Lo que aún no le depositan al titular. Si no llega antes de la fecha límite, genera intereses. */
  pendingToHolder: Cents;
}

export function statementSummary(params: {
  card: Card;
  cutoff: ISODate;
  expenses: Expense[];
  payments: Payment[];
}): StatementSummary {
  const { card, cutoff, expenses, payments } = params;
  const statement = statementFor(cutoff, card.cycle);
  const people = new Map<string, PersonInStatement>();
  const person = (userId: string) => {
    let p = people.get(userId);
    if (!p) {
      p = { userId, isHolder: userId === card.holderId, owed: 0, paid: 0, pending: 0, lines: [] };
      people.set(userId, p);
    }
    return p;
  };

  let total = 0;
  for (const e of expenses) {
    if (e.paidBy.kind !== "card" || e.paidBy.cardId !== card.id) continue;
    const schedule = installmentSchedule({ date: e.date, total: e.amount, count: e.installments, shares: e.shares, cycle: card.cycle });
    const inst = schedule.find((i) => i.statement.cutoff === cutoff);
    if (!inst) continue;
    total += inst.amount;
    for (const s of inst.shares) {
      if (s.amount === 0) continue;
      const p = person(s.userId);
      p.owed += s.amount;
      p.lines.push({
        expenseId: e.id,
        description: e.description,
        date: e.date,
        installment: e.installments > 1 ? { number: inst.number, of: inst.of } : null,
        amount: s.amount,
      });
    }
  }

  for (const pay of payments) {
    if (pay.cardId !== card.id || pay.cutoff !== cutoff || pay.toUserId !== card.holderId) continue;
    person(pay.fromUserId).paid += pay.amount;
  }

  let pendingToHolder = 0;
  for (const p of people.values()) {
    p.pending = p.isHolder ? 0 : Math.max(0, p.owed - p.paid);
    pendingToHolder += p.pending;
    p.lines.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }

  const ordered = [...people.values()].sort((a, b) => Number(a.isHolder) - Number(b.isHolder) || b.owed - a.owed);
  return { cardId: card.id, statement, total, people: ordered, pendingToHolder };
}

// ---------------------------------------------------------------------------
// Saldos generales y simplificación de deudas
// ---------------------------------------------------------------------------

/**
 * Saldo de cada persona. Positivo = le deben; negativo = debe.
 * Si se pasa `asOf`, las compras a meses solo cuentan las mensualidades
 * cuyo corte ya llegó; sin `asOf` se cuenta todo el total.
 */
export function balances(params: {
  expenses: Expense[];
  payments: Payment[];
  cards: Card[];
  asOf?: ISODate;
}): Map<string, Cents> {
  const cards = new Map(params.cards.map((c) => [c.id, c]));
  const bal = new Map<string, Cents>();
  const add = (u: string, v: Cents) => bal.set(u, (bal.get(u) ?? 0) + v);

  for (const e of params.expenses) {
    const creditor = creditorOf(e, cards);
    let shares = e.shares;
    if (params.asOf && e.paidBy.kind === "card") {
      const card = cards.get(e.paidBy.cardId)!;
      const schedule = installmentSchedule({ date: e.date, total: e.amount, count: e.installments, shares: e.shares, cycle: card.cycle });
      const due = schedule.filter((i) => i.statement.cutoff <= params.asOf!);
      const sums = new Map<string, Cents>();
      for (const i of due) for (const s of i.shares) sums.set(s.userId, (sums.get(s.userId) ?? 0) + s.amount);
      shares = [...sums].map(([userId, amount]) => ({ userId, amount }));
    }
    for (const s of shares) {
      if (s.userId === creditor) continue;
      add(creditor, s.amount);
      add(s.userId, -s.amount);
    }
  }
  for (const p of params.payments) {
    add(p.fromUserId, p.amount);
    add(p.toUserId, -p.amount);
  }
  return bal;
}

export interface Transfer {
  from: string;
  to: string;
  amount: Cents;
}

/** Empareja a quien más debe con quien más le deben hasta que todo queda en 0. */
export function simplifyDebts(bal: Map<string, Cents>): Transfer[] {
  const debtors = [...bal].filter(([, v]) => v < 0).map(([u, v]) => ({ u, v: -v }));
  const creditors = [...bal].filter(([, v]) => v > 0).map(([u, v]) => ({ u, v }));
  const byAmount = (a: { u: string; v: number }, b: { u: string; v: number }) => b.v - a.v || (a.u < b.u ? -1 : 1);
  const out: Transfer[] = [];
  while (debtors.length && creditors.length) {
    debtors.sort(byAmount);
    creditors.sort(byAmount);
    const d = debtors[0];
    const c = creditors[0];
    const amount = Math.min(d.v, c.v);
    out.push({ from: d.u, to: c.u, amount });
    d.v -= amount;
    c.v -= amount;
    if (d.v === 0) debtors.shift();
    if (c.v === 0) creditors.shift();
  }
  return out;
}
