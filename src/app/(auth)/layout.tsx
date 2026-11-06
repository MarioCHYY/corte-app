import Link from "next/link";
import { CorteLogo } from "@/components/brand/Logo";
import { AuthShowcase } from "./AuthShowcase";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="grid flex-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca (solo en pantallas grandes) */}
      <aside className="relative hidden overflow-hidden border-r border-line bg-slate-2 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-lime/10 blur-3xl"
        />
        <Link href="/" aria-label="Inicio" className="relative w-fit">
          <CorteLogo className="h-9 w-auto" />
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight">
            Cada quien su parte, <span className="text-lime">antes del corte.</span>
          </h2>
          <p className="mt-3 text-paper/70">
            corte acomoda cada cargo en su estado de cuenta y le dice a cada quien cuánto depositar y para cuándo.
          </p>

          <AuthShowcase />
        </div>

        <p className="relative text-sm text-mute">Gastos compartidos, a tiempo.</p>
      </aside>

      {/* Formulario */}
      <section className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <Link href="/" aria-label="Inicio" className="mb-10 lg:hidden">
          <CorteLogo className="h-9 w-auto" />
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </main>
  );
}
