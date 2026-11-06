import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getDb, schema } from "@/db";
import { requireUser, type CurrentUser } from "@/lib/auth/session";
import type { Card, Expense, ISODate, Payment } from "@/lib/domain";
import { today } from "@/lib/domain";

export type MemberRow = typeof schema.members.$inferSelect;
export type CardRow = typeof schema.cards.$inferSelect;
export type ExpenseRow = typeof schema.expenses.$inferSelect & { shares: (typeof schema.expenseShares.$inferSelect)[] };
export type PaymentRow = typeof schema.payments.$inferSelect;

export interface GroupContext {
  user: CurrentUser;
  group: typeof schema.groups.$inferSelect;
  me: MemberRow;
}

/**
 * Comprueba que el usuario actual pertenezca al grupo.
 * Si no, responde 404 (no revela que el grupo existe).
 */
export const requireGroup = cache(async (groupId: string): Promise<GroupContext> => {
  const user = await requireUser();
  const db = await getDb();
  const [row] = await db
    .select({ group: schema.groups, me: schema.members })
    .from(schema.members)
    .innerJoin(schema.groups, eq(schema.groups.id, schema.members.groupId))
    .where(and(eq(schema.members.groupId, groupId), eq(schema.members.userId, user.id)))
    .limit(1);
  if (!row) notFound();
  return { user, group: row.group, me: row.me };
});

export interface GroupData extends GroupContext {
  members: MemberRow[];
  cards: CardRow[];
  expenses: ExpenseRow[];
  payments: PaymentRow[];
  bankTotals: Map<string, number>; // `${cardId}|${cutoff}` -> total del banco
  memberName: (id: string | null | undefined) => string;
  today: ISODate;
  domain: { cards: Card[]; expenses: Expense[]; payments: Payment[] };
}

/** Carga todo lo del grupo. Para una familia son pocos cientos de filas: alcanza y sobra. */
export const loadGroup = cache(async (groupId: string): Promise<GroupData> => {
  const ctx = await requireGroup(groupId);
  const db = await getDb();
  const [members, cards, expenseRows, payments] = await Promise.all([
    db.select().from(schema.members).where(eq(schema.members.groupId, groupId)).orderBy(asc(schema.members.createdAt), asc(schema.members.name)),
    db.select().from(schema.cards).where(eq(schema.cards.groupId, groupId)).orderBy(asc(schema.cards.createdAt)),
    db.query.expenses.findMany({
      where: eq(schema.expenses.groupId, groupId),
      with: { shares: true },
      orderBy: [desc(schema.expenses.date), desc(schema.expenses.createdAt)],
    }),
    db.select().from(schema.payments).where(eq(schema.payments.groupId, groupId)).orderBy(desc(schema.payments.date), desc(schema.payments.createdAt)),
  ]);
  const statements = cards.length
    ? await db.select().from(schema.cardStatements).where(inArray(schema.cardStatements.cardId, cards.map((c) => c.id)))
    : [];

  const names = new Map(members.map((m) => [m.id, m.name]));
  return {
    ...ctx,
    members,
    cards,
    expenses: expenseRows,
    payments,
    bankTotals: new Map(statements.map((s) => [`${s.cardId}|${s.cutoff}`, s.bankTotal])),
    memberName: (id) => (id ? (names.get(id) ?? "Alguien") : "Alguien"),
    today: today(),
    domain: {
      cards: cards.map(toDomainCard),
      expenses: expenseRows.map(toDomainExpense),
      payments: payments.map(toDomainPayment),
    },
  };
});

export function toDomainCard(c: CardRow): Card {
  return { id: c.id, holderId: c.holderId, cycle: { cutoffDay: c.cutoffDay, dueDays: c.dueDays } };
}

export function toDomainExpense(e: ExpenseRow): Expense {
  return {
    id: e.id,
    description: e.description,
    amount: e.amount,
    date: e.date,
    paidBy: e.cardId ? { kind: "card", cardId: e.cardId } : { kind: "user", userId: e.paidById! },
    installments: e.cardId ? e.installments : 1,
    shares: e.shares.map((s) => ({ userId: s.memberId, amount: s.amount })),
  };
}

export function toDomainPayment(p: PaymentRow): Payment {
  return {
    id: p.id,
    fromUserId: p.fromId,
    toUserId: p.toId,
    amount: p.amount,
    date: p.date,
    cardId: p.cardId ?? undefined,
    cutoff: p.cutoff ?? undefined,
  };
}

/** Grupos del usuario con su rol, para /grupos. */
export async function listMyGroups(userId: string) {
  const db = await getDb();
  return db
    .select({ id: schema.groups.id, name: schema.groups.name, role: schema.members.role, myName: schema.members.name })
    .from(schema.members)
    .innerJoin(schema.groups, eq(schema.groups.id, schema.members.groupId))
    .where(eq(schema.members.userId, userId))
    .orderBy(asc(schema.groups.createdAt));
}
