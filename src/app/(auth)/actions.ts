"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { newId } from "@/lib/ids";
import { safeNext, type FormState } from "@/lib/form";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(60),
  email: z.string().trim().toLowerCase().email("Ese correo no se ve bien"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
});

export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;

  const db = await getDb();
  const [exists] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email));
  if (exists) return { error: "Ya hay una cuenta con ese correo. Mejor inicia sesión." };

  const id = newId();
  await db.insert(schema.users).values({ id, name, email, passwordHash: await hashPassword(password) });
  await createSession(id);
  redirect(safeNext(formData.get("next")));
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Escribe tu correo"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password } = parsed.data;

  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (user && !user.passwordHash) {
    return { error: "Esta cuenta entra con Google. Usa el botón de “Continuar con Google”." };
  }
  // Mismo mensaje en los dos casos para no revelar qué correos existen
  if (!user || !(await verifyPassword(password, user.passwordHash!))) {
    return { error: "Correo o contraseña incorrectos" };
  }
  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
