import "server-only";
import { getDb, schema } from "@/db";
import type { CurrentUser } from "@/lib/auth/session";
import {
  addDays,
  currentStatement,
  shiftCutoff,
  splitEqual,
  statementSummary,
  today,
  type Expense,
  type ISODate,
} from "@/lib/domain";
import { newId, newInviteCode } from "@/lib/ids";

/**
 * Crea un grupo de ejemplo con la situación típica de una casa:
 * todos usan la tarjeta de Perla. Las fechas se calculan desde hoy para que
 * el ejemplo siempre se vea "vivo".
 */
export async function seedDemoGroup(user: CurrentUser): Promise<string> {
  const db = await getDb();
  const now = today();
  const cycle = { cutoffDay: 5, dueDays: 20 };
  const cur = currentStatement(now, cycle);
  const clamp = (d: ISODate) => (d > now ? now : d);
  const inCur = (days: number) => clamp(addDays(cur.periodStart, days));

  const groupId = newId();
  const me = newId();
  const perla = newId();
  const beto = newId();
  const carlos = newId();
  const cardId = newId();
  const all = [perla, me, beto, carlos];

  type Row = Omit<Expense, "paidBy" | "id"> & { card?: boolean; paidBy?: string; kind: "shared" | "personal" | "gift"; giftFor?: string };
  const rows: Row[] = [
    { description: "Luz (CFE)", amount: 90000, date: inCur(3), installments: 1, shares: splitEqual(90000, all), card: true, kind: "shared" },
    { description: "Agua", amount: 35000, date: inCur(9), installments: 1, shares: splitEqual(35000, all), card: true, kind: "shared" },
    { description: "Súper de la semana", amount: 234000, date: inCur(12), installments: 1, shares: splitEqual(234000, all), card: true, kind: "shared" },
    { description: "Audífonos", amount: 80000, date: inCur(5), installments: 1, shares: [{ userId: me, amount: 80000 }], card: true, kind: "personal" },
    { description: "Perfume", amount: 120000, date: inCur(8), installments: 1, shares: [{ userId: carlos, amount: 120000 }], card: true, kind: "gift", giftFor: "Mamá" },
    {
      description: "Celular",
      amount: 600000,
      date: addDays(shiftCutoff(cur.cutoff, -2, 5), -10),
      installments: 6,
      shares: [{ userId: beto, amount: 600000 }],
      card: true,
      kind: "personal",
    },
    {
      description: "Refrigerador",
      amount: 1200000,
      date: addDays(shiftCutoff(cur.cutoff, -1, 5), -6),
      installments: 12,
      shares: splitEqual(1200000, [me, beto]),
      card: true,
      kind: "shared",
    },
    { description: "Internet", amount: 59900, date: addDays(shiftCutoff(cur.cutoff, -1, 5), 1), installments: 1, shares: splitEqual(59900, all), card: true, kind: "shared" },
    { description: "Luz (CFE)", amount: 84000, date: addDays(shiftCutoff(cur.cutoff, -1, 5), -20), installments: 1, shares: splitEqual(84000, all), card: true, kind: "shared" },
    { description: "Pizzas del viernes", amount: 45000, date: clamp(addDays(now, -2)), installments: 1, shares: splitEqual(45000, all), paidBy: me, kind: "shared" },
    { description: "Uber al aeropuerto", amount: 28000, date: clamp(addDays(now, -6)), installments: 1, shares: splitEqual(28000, [beto, carlos]), paidBy: beto, kind: "shared" },
  ];

  // El internet de este mes solo si ya pasó el corte (si no, sería una fecha futura)
  if (addDays(cur.cutoff, 1) <= now) {
    rows.push({ description: "Internet", amount: 59900, date: addDays(cur.cutoff, 1), installments: 1, shares: splitEqual(59900, all), card: true, kind: "shared" });
  }

  const expenses = rows.map((r) => ({ ...r, id: newId() }));
  const domainExpenses: Expense[] = expenses
    .filter((e) => e.card)
    .map((e) => ({ id: e.id, description: e.description, amount: e.amount, date: e.date, installments: e.installments, shares: e.shares, paidBy: { kind: "card", cardId } }));

  // El corte anterior ya quedó pagado por todos; en el actual Mario lleva la mitad
  const card = { id: cardId, holderId: perla, cycle };
  const prevCutoff = shiftCutoff(cur.cutoff, -1, 5);
  const prev = statementSummary({ card, cutoff: prevCutoff, expenses: domainExpenses, payments: [] });
  const curSum = statementSummary({ card, cutoff: cur.cutoff, expenses: domainExpenses, payments: [] });
  const payments: (typeof schema.payments.$inferInsert)[] = prev.people
    .filter((p) => !p.isHolder && p.owed > 0)
    .map((p, i) => ({
      id: newId(),
      groupId,
      fromId: p.userId,
      toId: perla,
      amount: p.owed,
      date: clamp(addDays(prev.statement.cutoff, 4 + i * 3)),
      cardId,
      cutoff: prevCutoff,
    }));
  const meNow = curSum.people.find((p) => p.userId === me);
  if (meNow && meNow.owed > 0) {
    payments.push({
      id: newId(),
      groupId,
      fromId: me,
      toId: perla,
      amount: Math.round(meNow.owed / 2 / 100) * 100,
      date: clamp(addDays(cur.cutoff, 2)),
      cardId,
      cutoff: cur.cutoff,
      note: "Abono",
    });
  }

  await db.transaction(async (tx) => {
    await tx.insert(schema.groups).values({ id: groupId, name: "Casa (ejemplo)", inviteCode: newInviteCode() });
    await tx.insert(schema.members).values([
      { id: perla, groupId, name: "Perla" },
      { id: me, groupId, userId: user.id, name: user.name, role: "admin" },
      { id: beto, groupId, name: "Beto" },
      { id: carlos, groupId, name: "Carlos" },
    ]);
    await tx.insert(schema.cards).values({ id: cardId, groupId, holderId: perla, name: "Tarjeta de Perla", last4: "4821", ...cycle });
    for (const e of expenses) {
      await tx.insert(schema.expenses).values({
        id: e.id,
        groupId,
        description: e.description,
        amount: e.amount,
        date: e.date,
        kind: e.kind,
        splitMode: e.shares.length > 1 ? "equal" : "exact",
        cardId: e.card ? cardId : null,
        paidById: e.card ? null : e.paidBy!,
        installments: e.installments,
        giftFor: e.giftFor ?? null,
        createdById: me,
      });
      await tx.insert(schema.expenseShares).values(e.shares.map((s) => ({ expenseId: e.id, memberId: s.userId, amount: s.amount })));
    }
    if (payments.length) await tx.insert(schema.payments).values(payments);
    await tx.insert(schema.cardStatements).values({ cardId, cutoff: prevCutoff, bankTotal: prev.total });
  });
  return groupId;
}
