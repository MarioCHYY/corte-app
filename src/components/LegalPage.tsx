import Link from "next/link";
import { CorteLogo } from "@/components/brand/Logo";
import { SITE } from "@/lib/site";

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <main className="flex-1">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" aria-label="Inicio">
          <CorteLogo className="h-8 w-auto" />
        </Link>
        <nav className="flex gap-4 text-sm text-mute">
          <Link href="/privacidad" className="hover:text-paper">
            Privacidad
          </Link>
          <Link href="/terminos" className="hover:text-paper">
            Términos
          </Link>
          <Link href="/ayuda" className="hover:text-paper">
            Ayuda
          </Link>
        </nav>
      </header>
      <article className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6">
        <p className="text-sm text-mute">Última actualización: {SITE.legalUpdated}</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-paper/75">{intro}</p>
        <div className="legal mt-10 space-y-8 leading-relaxed text-paper/85">{children}</div>
      </article>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-paper">{title}</h2>
      <div className="mt-3 space-y-3 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{children}</div>
    </section>
  );
}
