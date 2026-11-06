import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";

/** Descarga en JSON todo lo que corte guarda de la persona y de sus grupos. */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
  const db = await getDb();

  const [user] = await db
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, google: schema.users.googleId, createdAt: schema.users.createdAt })
    .from(schema.users)
    .where(eq(schema.users.id, me.id));
  const sessions = await db
    .select({ createdAt: schema.sessions.createdAt, expiresAt: schema.sessions.expiresAt, userAgent: schema.sessions.userAgent })
    .from(schema.sessions)
    .where(eq(schema.sessions.userId, me.id));
  const memberships = await db.select().from(schema.members).where(eq(schema.members.userId, me.id));
  const groupIds = memberships.map((m) => m.groupId);

  const groups = [];
  if (groupIds.length) {
    const [gs, members, cards, expenses, shares, payments] = await Promise.all([
      db.select().from(schema.groups).where(inArray(schema.groups.id, groupIds)),
      db.select().from(schema.members).where(inArray(schema.members.groupId, groupIds)),
      db.select().from(schema.cards).where(inArray(schema.cards.groupId, groupIds)),
      db.select().from(schema.expenses).where(inArray(schema.expenses.groupId, groupIds)),
      db
        .select({ share: schema.expenseShares, groupId: schema.expenses.groupId })
        .from(schema.expenseShares)
        .innerJoin(schema.expenses, eq(schema.expenses.id, schema.expenseShares.expenseId))
        .where(inArray(schema.expenses.groupId, groupIds)),
      db.select().from(schema.payments).where(inArray(schema.payments.groupId, groupIds)),
    ]);
    const cents = (n: number) => n / 100;
    for (const g of gs) {
      groups.push({
        nombre: g.name,
        miRol: memberships.find((m) => m.groupId === g.id)?.role,
        personas: members.filter((m) => m.groupId === g.id).map((m) => ({ id: m.id, nombre: m.name, tieneCuenta: !!m.userId, rol: m.role })),
        tarjetas: cards
          .filter((c) => c.groupId === g.id)
          .map((c) => ({ id: c.id, nombre: c.name, ultimos4: c.last4, titular: c.holderId, diaDeCorte: c.cutoffDay, diasParaPagar: c.dueDays })),
        gastos: expenses
          .filter((e) => e.groupId === g.id)
          .map((e) => ({
            descripcion: e.description,
            monto: cents(e.amount),
            fecha: e.date,
            tipo: e.kind,
            pagoPersona: e.paidById,
            tarjeta: e.cardId,
            meses: e.installments,
            partes: shares.filter((s) => s.share.expenseId === e.id).map((s) => ({ persona: s.share.memberId, monto: cents(s.share.amount) })),
          })),
        pagos: payments
          .filter((p) => p.groupId === g.id)
          .map((p) => ({ de: p.fromId, a: p.toId, monto: cents(p.amount), fecha: p.date, tarjeta: p.cardId, corte: p.cutoff, nota: p.note })),
      });
    }
  }

  const body = JSON.stringify(
    {
      exportadoEl: new Date().toISOString(),
      nota: "Montos en pesos mexicanos. Los ids sirven para relacionar personas, tarjetas y gastos.",
      cuenta: { nombre: user.name, correo: user.email, conGoogle: !!user.google, creadaEl: user.createdAt },
      sesiones: sessions,
      grupos: groups,
    },
    null,
    2,
  );
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="corte-mis-datos-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
