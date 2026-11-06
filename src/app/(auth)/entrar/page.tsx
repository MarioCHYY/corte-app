import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { googleEnabled } from "@/lib/auth/google";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/form";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/entrar">) {
  const { next, error } = await searchParams;
  const nextPath = typeof next === "string" ? safeNext(next) : undefined;
  if (await getCurrentUser()) redirect(nextPath ?? "/grupos");
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">Qué gusto verte de nuevo</h1>
      <p className="mb-8 mt-2 text-mute">Entra para ver cuánto te toca este corte.</p>
      <AuthForm mode="login" next={nextPath} google={googleEnabled()} initialError={typeof error === "string" ? error.slice(0, 160) : undefined} />
    </>
  );
}
