"use server";

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { requireUser } from "@/lib/auth/session";
import { formatMXN, validateCycle } from "@/lib/domain";
import type { FormState } from "@/lib/form";
import { newId, newInviteCode } from "@/lib/ids";
import { requireGroup } from "./data";
import { seedDemoGroup } from "./demo";
import { computeShares, expenseInputSchema, moneySchema } from "./validation";

const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? "Revisa los datos";
const name = z.string().trim().min(1, "Escribe un nombre").max(60);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

function refresh(groupId: string) {
  revalidatePath(`/g/${groupId}`, "layout");
}

// ---------------------------------------------------------------------------
// Grupos
// ---------------------------------------------------------------------------

export async function createGroup(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = z.object({ name, myName: name }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const db = await getDb();
  const groupId = newId();
  await db.transaction(async (tx) => {
    await tx.insert(schema.groups).values({ id: groupId, name: parsed.data.name, inviteCode: newInviteCode() });
    await tx.insert(schema.members).values({ id: newId(), groupId, userId: user.id, name: parsed.data.myName, role: "admin" });
  });
  redirect(`/g/${groupId}`);
}

export async function createDemoGroup(): Promise<void> {
  const user = await requireUser();
  const groupId = await seedDemoGroup(user);
  redirect(`/g/${groupId}`);
}

/** Buscar un grupo por código, para el formulario de /grupos. */
export async function goToInvite(_: FormState, formData: FormData): Promise<FormState> {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (code.length < 4) return { error: "Escribe el código que te pasaron" };
  const db = await getDb();
  const [g] = await db.select({ id: schema.groups.id }).from(schema.groups).where(eq(schema.groups.inviteCode, code));
  if (!g) return { error: "No encontramos un grupo con ese código" };
  redirect(`/unirse/${code}`);
}

export async function joinGroup(code: string, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const db = await getDb();
  const [group] = await db.select().from(schema.groups).where(eq(schema.groups.inviteCode, code));
  if (!group) return { error: "Este link de invitación ya no funciona" };

  const [already] = await db
    .select({ id: schema.members.id })
    .from(schema.members)
    .where(and(eq(schema.members.groupId, group.id), eq(schema.members.userId, user.id)));
  if (already) redirect(`/g/${group.id}`);

  const claim = String(formData.get("memberId") ?? "");
  if (claim && claim !== "new") {
    // Reclamar a una persona que ya estaba en el grupo sin cuenta
    const updated = await db
      .update(schema.members)
      .set({ userId: user.id })
      .where(and(eq(schema.members.id, claim), eq(schema.members.groupId, group.id), isNull(schema.members.userId)))
      .returning({ id: schema.members.id });
    if (updated.length === 0) return { error: "Esa persona ya tiene cuenta. Elige otra o entra como nueva." };
  } else {
    const parsed = name.safeParse(formData.get("newName"));
    if (!parsed.success) return { error: "Escribe cómo te llamas en el grupo" };
    await db.insert(schema.members).values({ id: newId(), groupId: group.id, userId: user.id, name: parsed.data });
  }
  redirect(`/g/${group.id}`);
}

export async function renameGroup(groupId: string, _: FormState, formData: FormData): Promise<FormState> {
  await requireGroup(groupId);
  const parsed = name.safeParse(formData.get("name"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const db = await getDb();
  await db.update(schema.groups).set({ name: parsed.data }).where(eq(schema.groups.id, groupId));
  refresh(groupId);
  return { ok: "Listo" };
}

export async function newInviteCodeFor(groupId: string): Promise<void> {
  const { me } = await requireGroup(groupId);
  if (me.role !== "admin") return;
  const db = await getDb();
  await db.update(schema.groups).set({ inviteCode: newInviteCode() }).where(eq(schema.groups.id, groupId));
  refresh(groupId);
}

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------

export async function addMember(groupId: string, _: FormState, formData: FormData): Promise<FormState> {
  await requireGroup(groupId);
  const parsed = name.safeParse(formData.get("name"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const db = await getDb();
  await db.insert(schema.members).values({ id: newId(), groupId, name: parsed.data });
  refresh(groupId);
  return { ok: `${parsed.data} ya está en el grupo` };
}

export async function renameMember(groupId: string, memberId: string, _: FormState, formData: FormData): Promise<FormState> {
  await requireGroup(groupId);
  const parsed = name.safeParse(formData.get("name"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const db = await getDb();
  await db
    .update(schema.members)
    .set({ name: parsed.data })
    .where(and(eq(schema.members.id, memberId), eq(schema.members.groupId, groupId)));
  refresh(groupId);
  return { ok: "Guardado" };
}

// ---------------------------------------------------------------------------
// Tarjetas
// ---------------------------------------------------------------------------

const cardSchema = z.object({
  name: name,
  last4: z
    .string()
    .trim()
    .regex(/^(\d{4})?$/, "Solo los últimos 4 números")
    .optional()
    .transform((v) => v || null),
  holderId: z.string().min(1, "Elige al titular"),
  cutoffDay: z.coerce.number().int().min(1, "Día de corte entre 1 y 31").max(31, "Día de corte entre 1 y 31"),
  dueDays: z.coerce.number().int().min(1, "Días para pagar entre 1 y 60").max(60, "Días para pagar entre 1 y 60"),
});

async function assertMember(groupId: string, memberId: string) {
  const db = await getDb();
  const [m] = await db
    .select({ id: schema.members.id })
    .from(schema.members)
    .where(and(eq(schema.members.id, memberId), eq(schema.members.groupId, groupId)));
  if (!m) throw new Error("Esa persona no está en el grupo");
}

export async function saveCard(groupId: string, cardId: string | null, _: FormState, formData: FormData): Promise<FormState> {
  await requireGroup(groupId);
  const parsed = cardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const data = parsed.data;
  try {
    validateCycle(data);
    await assertMember(groupId, data.holderId);
  } catch (e) {
    return { error: (e as Error).message };
  }
  const db = await getDb();
  let id = cardId;
  if (cardId) {
    await db
      .update(schema.cards)
      .set(data)
      .where(and(eq(schema.cards.id, cardId), eq(schema.cards.groupId, groupId)));
  } else {
    id = newId();
    await db.insert(schema.cards).values({ id, groupId, ...data });
  }
  refresh(groupId);
  redirect(`/g/${groupId}/tarjetas/${id}`);
}

const bankTotalSchema = z.object({ cutoff: isoDate, bankTotal: z.string() });

export async function setBankTotal(groupId: string, cardId: string, _: FormState, formData: FormData): Promise<FormState> {
  await requireGroup(groupId);
  const parsed = bankTotalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const db = await getDb();
  const [card] = await db
    .select({ id: schema.cards.id })
    .from(schema.cards)
    .where(and(eq(schema.cards.id, cardId), eq(schema.cards.groupId, groupId)));
  if (!card) return { error: "Tarjeta no encontrada" };

  const raw = parsed.data.bankTotal.trim();
  if (!raw) {
    await db
      .delete(schema.cardStatements)
      .where(and(eq(schema.cardStatements.cardId, cardId), eq(schema.cardStatements.cutoff, parsed.data.cutoff)));
  } else {
    const amount = moneySchema.safeParse(raw);
    if (!amount.success) return { error: firstIssue(amount.error) };
    await db
      .insert(schema.cardStatements)
      .values({ cardId, cutoff: parsed.data.cutoff, bankTotal: amount.data })
      .onConflictDoUpdate({
        target: [schema.cardStatements.cardId, schema.cardStatements.cutoff],
        set: { bankTotal: amount.data },
      });
  }
  refresh(groupId);
  return { ok: "Guardado" };
}

// ---------------------------------------------------------------------------
// Gastos
// ---------------------------------------------------------------------------

export async function saveExpense(groupId: string, expenseId: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const { me } = await requireGroup(groupId);
  let json: unknown;
  try {
    json = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "No se pudo leer el formulario" };
  }
  const parsed = expenseInputSchema.safeParse(json);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const e = parsed.data;

  let computed;
  try {
    computed = computeShares(e);
  } catch (err) {
    return { error: (err as Error).message };
  }

  const db = await getDb();
  // Todas las personas y la tarjeta tienen que ser de este grupo
  const groupMembers = new Set(
    (await db.select({ id: schema.members.id }).from(schema.members).where(eq(schema.members.groupId, groupId))).map((m) => m.id),
  );
  const ids = computed.shares.map((s) => s.userId).concat(e.paid.type === "member" ? [e.paid.memberId] : []);
  if (ids.some((id) => !groupMembers.has(id))) return { error: "Hay una persona que no es del grupo" };
  if (e.paid.type === "card") {
    const [card] = await db
      .select({ id: schema.cards.id })
      .from(schema.cards)
      .where(and(eq(schema.cards.id, e.paid.cardId), eq(schema.cards.groupId, groupId)));
    if (!card) return { error: "Esa tarjeta no es del grupo" };
  }

  const values = {
    description: e.description,
    amount: e.amount,
    date: e.date,
    kind: e.kind,
    splitMode: computed.splitMode,
    paidById: e.paid.type === "member" ? e.paid.memberId : null,
    cardId: e.paid.type === "card" ? e.paid.cardId : null,
    installments: e.paid.type === "card" ? e.installments : 1,
    giftFor: e.kind === "gift" ? e.giftFor || null : null,
  };

  const id = expenseId ?? newId();
  const ok = await db.transaction(async (tx) => {
    if (expenseId) {
      const updated = await tx
        .update(schema.expenses)
        .set(values)
        .where(and(eq(schema.expenses.id, expenseId), eq(schema.expenses.groupId, groupId)))
        .returning({ id: schema.expenses.id });
      if (updated.length === 0) return false;
      await tx.delete(schema.expenseShares).where(eq(schema.expenseShares.expenseId, expenseId));
    } else {
      await tx.insert(schema.expenses).values({ id, groupId, createdById: me.id, ...values });
    }
    await tx.insert(schema.expenseShares).values(
      computed.shares.map((s) => ({ expenseId: id, memberId: s.userId, amount: s.amount, basisPoints: s.basisPoints ?? null })),
    );
    return true;
  });
  if (!ok) return { error: "Ese gasto ya no existe" };

  refresh(groupId);
  const returnTo = String(formData.get("returnTo") ?? "");
  redirect(returnTo.startsWith(`/g/${groupId}/`) || returnTo === `/g/${groupId}` ? returnTo : `/g/${groupId}/movimientos`);
}

export async function deleteExpense(groupId: string, expenseId: string): Promise<void> {
  await requireGroup(groupId);
  const db = await getDb();
  await db.delete(schema.expenses).where(and(eq(schema.expenses.id, expenseId), eq(schema.expenses.groupId, groupId)));
  refresh(groupId);
  redirect(`/g/${groupId}/movimientos`);
}

// ---------------------------------------------------------------------------
// Pagos
// ---------------------------------------------------------------------------

const paymentSchema = z.object({
  fromId: z.string().min(1, "¿Quién pagó?"),
  toId: z.string().min(1, "¿A quién le pagó?"),
  amount: moneySchema,
  date: isoDate,
  cardId: z.string().optional().transform((v) => v || null),
  cutoff: z
    .string()
    .optional()
    .transform((v) => v || null)
    .pipe(isoDate.nullable()),
  note: z.string().trim().max(120).optional().transform((v) => v || null),
});

export async function createPayment(groupId: string, _: FormState, formData: FormData): Promise<FormState> {
  await requireGroup(groupId);
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const p = parsed.data;
  if (p.fromId === p.toId) return { error: "Quien paga y quien recibe deben ser personas distintas" };
  try {
    await assertMember(groupId, p.fromId);
    await assertMember(groupId, p.toId);
  } catch (e) {
    return { error: (e as Error).message };
  }
  const db = await getDb();
  if (p.cardId) {
    const [card] = await db
      .select({ id: schema.cards.id })
      .from(schema.cards)
      .where(and(eq(schema.cards.id, p.cardId), eq(schema.cards.groupId, groupId)));
    if (!card) return { error: "Esa tarjeta no es del grupo" };
  }
  await db.insert(schema.payments).values({ id: newId(), groupId, ...p, cutoff: p.cardId ? p.cutoff : null });
  refresh(groupId);
  return { ok: `Pago de ${formatMXN(p.amount)} registrado` };
}

export async function deletePayment(groupId: string, paymentId: string): Promise<void> {
  await requireGroup(groupId);
  const db = await getDb();
  await db.delete(schema.payments).where(and(eq(schema.payments.id, paymentId), eq(schema.payments.groupId, groupId)));
  refresh(groupId);
}

// ---------------------------------------------------------------------------
// Salir y eliminar grupo
// ---------------------------------------------------------------------------

export async function leaveGroup(groupId: string): Promise<FormState> {
  const { me } = await requireGroup(groupId);
  const db = await getDb();
  const withAccount = await db
    .select({ id: schema.members.id, role: schema.members.role })
    .from(schema.members)
    .where(and(eq(schema.members.groupId, groupId), isNotNull(schema.members.userId)));
  const others = withAccount.filter((m) => m.id !== me.id);
  if (others.length === 0) {
    return { error: "Eres la única persona con cuenta en este grupo. Si ya no lo necesitas, mejor elimínalo." };
  }
  await db.transaction(async (tx) => {
    if (me.role === "admin" && !others.some((o) => o.role === "admin")) {
      await tx.update(schema.members).set({ role: "admin" }).where(eq(schema.members.id, others[0].id));
    }
    // Tu nombre se queda en el grupo (sin cuenta) para no descuadrar los saldos
    await tx.update(schema.members).set({ userId: null, role: "member" }).where(eq(schema.members.id, me.id));
  });
  redirect("/grupos");
}

export async function deleteGroup(groupId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { me, group } = await requireGroup(groupId);
  if (me.role !== "admin") return { error: "Solo un admin puede eliminar el grupo" };
  if (String(formData.get("confirm") ?? "").trim() !== group.name) {
    return { error: `Escribe exactamente "${group.name}" para confirmar` };
  }
  const db = await getDb();
  await db.delete(schema.groups).where(eq(schema.groups.id, groupId));
  redirect("/grupos");
}

export async function setMemberRole(groupId: string, memberId: string, role: "admin" | "member"): Promise<void> {
  const { me } = await requireGroup(groupId);
  if (me.role !== "admin" || memberId === me.id) return;
  const db = await getDb();
  await db
    .update(schema.members)
    .set({ role })
    .where(and(eq(schema.members.id, memberId), eq(schema.members.groupId, groupId), isNotNull(schema.members.userId)));
  refresh(groupId);
}
