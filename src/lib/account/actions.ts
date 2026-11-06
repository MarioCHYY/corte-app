"use server";

import { and, eq, inArray, isNotNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { currentSessionId, destroySession, requireUser } from "@/lib/auth/session";
import type { FormState } from "@/lib/form";

const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? "Revisa los datos";

async function loadMe() {
  const me = await requireUser();
  const db = await getDb();
  const [row] = await db.select().from(schema.users).where(eq(schema.users.id, me.id));
  return { db, user: row };
}

// ---------------------------------------------------------------------------
// Perfil
// ---------------------------------------------------------------------------

export async function updateName(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.string().trim().min(2, "Escribe tu nombre").max(60).safeParse(formData.get("name"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { db, user } = await loadMe();
  await db.update(schema.users).set({ name: parsed.data }).where(eq(schema.users.id, user.id));
  revalidatePath("/", "layout");
  return { ok: "Nombre actualizado" };
}

export async function changeEmail(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ email: z.string().trim().toLowerCase().email("Ese correo no se ve bien"), password: z.string().optional() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { db, user } = await loadMe();
  if (parsed.data.email === user.email) return { error: "Ese ya es tu correo" };
  if (!user.passwordHash) return { error: "Tu cuenta usa el correo de Google. Crea una contraseña primero para poder cambiarlo." };
  if (!(await verifyPassword(parsed.data.password ?? "", user.passwordHash))) return { error: "La contraseña no es correcta" };
  const [taken] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, parsed.data.email));
  if (taken) return { error: "Ya hay otra cuenta con ese correo" };
  await db.update(schema.users).set({ email: parsed.data.email }).where(eq(schema.users.id, user.id));
  revalidatePath("/cuenta", "layout");
  return { ok: "Correo actualizado" };
}

// ---------------------------------------------------------------------------
// Seguridad
// ---------------------------------------------------------------------------

export async function changePassword(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      current: z.string().optional(),
      next: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres").max(200),
      confirm: z.string(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { current, next, confirm } = parsed.data;
  if (next !== confirm) return { error: "Las contraseñas nuevas no coinciden" };
  const { db, user } = await loadMe();
  if (user.passwordHash && !(await verifyPassword(current ?? "", user.passwordHash))) {
    return { error: "Tu contraseña actual no es correcta" };
  }
  await db.update(schema.users).set({ passwordHash: await hashPassword(next) }).where(eq(schema.users.id, user.id));
  // Por seguridad se cierran las demás sesiones
  const sid = await currentSessionId();
  if (sid) await db.delete(schema.sessions).where(and(eq(schema.sessions.userId, user.id), ne(schema.sessions.id, sid)));
  revalidatePath("/cuenta", "layout");
  return { ok: user.passwordHash ? "Contraseña cambiada. Cerramos tus otras sesiones." : "Listo, ya puedes entrar también con tu correo y contraseña." };
}

export async function unlinkGoogle(): Promise<void> {
  const { db, user } = await loadMe();
  // Solo si tiene otra forma de entrar
  if (!user.passwordHash) return;
  await db.update(schema.users).set({ googleId: null }).where(eq(schema.users.id, user.id));
  revalidatePath("/cuenta", "layout");
}

export async function signOutSession(sessionId: string): Promise<void> {
  const { db, user } = await loadMe();
  await db.delete(schema.sessions).where(and(eq(schema.sessions.id, sessionId), eq(schema.sessions.userId, user.id)));
  revalidatePath("/cuenta", "layout");
}

export async function signOutOthers(): Promise<void> {
  const { db, user } = await loadMe();
  const sid = await currentSessionId();
  if (!sid) return;
  await db.delete(schema.sessions).where(and(eq(schema.sessions.userId, user.id), ne(schema.sessions.id, sid)));
  revalidatePath("/cuenta", "layout");
}

// ---------------------------------------------------------------------------
// Eliminar cuenta
// ---------------------------------------------------------------------------

/**
 * Borra la cuenta. En los grupos compartidos la persona se queda (sin cuenta)
 * para que las cuentas de los demás no se descuadren. Los grupos donde nadie
 * más tiene cuenta se borran completos.
 */
export async function deleteAccount(_: FormState, formData: FormData): Promise<FormState> {
  const { db, user } = await loadMe();
  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "ELIMINAR") {
    return { error: "Escribe ELIMINAR para confirmar" };
  }
  if (user.passwordHash && !(await verifyPassword(String(formData.get("password") ?? ""), user.passwordHash))) {
    return { error: "La contraseña no es correcta" };
  }

  await db.transaction(async (tx) => {
    const mine = await tx.select().from(schema.members).where(eq(schema.members.userId, user.id));
    const groupIds = mine.map((m) => m.groupId);
    if (groupIds.length) {
      const others = await tx
        .select({ groupId: schema.members.groupId, id: schema.members.id, role: schema.members.role })
        .from(schema.members)
        .where(and(inArray(schema.members.groupId, groupIds), isNotNull(schema.members.userId), ne(schema.members.userId, user.id)));
      const shared = new Set(others.map((o) => o.groupId));
      const soloGroups = groupIds.filter((g) => !shared.has(g));
      if (soloGroups.length) await tx.delete(schema.groups).where(inArray(schema.groups.id, soloGroups));
      // Si era admin de un grupo compartido, otra persona con cuenta queda de admin
      for (const m of mine.filter((m) => m.role === "admin" && shared.has(m.groupId))) {
        const hasOtherAdmin = others.some((o) => o.groupId === m.groupId && o.role === "admin");
        if (!hasOtherAdmin) {
          const heir = others.find((o) => o.groupId === m.groupId)!;
          await tx.update(schema.members).set({ role: "admin" }).where(eq(schema.members.id, heir.id));
        }
      }
      await tx.update(schema.members).set({ userId: null, role: "member" }).where(eq(schema.members.userId, user.id));
    }
    await tx.delete(schema.users).where(eq(schema.users.id, user.id));
  });

  await destroySession().catch(() => {});
  redirect("/?cuenta=eliminada");
}
