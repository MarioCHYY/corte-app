import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { googleEnabled } from "@/lib/auth/google";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/form";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function SignupPage({ searchParams }: PageProps<"/registro">) {
  const { next, error } = await searchParams;
  const nextPath = typeof next === "string" ? safeNext(next) : undefined;
  if (await getCurrentUser()) redirect(nextPath ?? "/grupos");
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">Crea tu cuenta</h1>
      <p className="mb-8 mt-2 text-mute">Gratis. Luego creas tu grupo o te unes al de tu familia.</p>
      <AuthForm mode="signup" next={nextPath} google={googleEnabled()} initialError={typeof error === "string" ? error.slice(0, 160) : undefined} />
    </>
  );
}
