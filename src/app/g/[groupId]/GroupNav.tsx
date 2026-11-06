"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Resumen" },
  { href: "/tarjetas", label: "Tarjetas" },
  { href: "/movimientos", label: "Movimientos" },
  { href: "/personas", label: "Personas" },
  { href: "/ajustes", label: "Ajustes" },
];

export function GroupNav({ base }: { base: string }) {
  const path = usePathname();
  const isActive = (href: string) => (href === "" ? path === base : path.startsWith(base + href));
  return (
    <>
      <nav className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-4 sm:px-6">
          {TABS.map((t) => (
            <Link
              key={t.label}
              href={base + t.href}
              aria-current={isActive(t.href) ? "page" : undefined}
              className={`relative whitespace-nowrap px-3 py-3 text-sm font-medium transition ${
                isActive(t.href) ? "text-paper" : "text-mute hover:text-paper"
              }`}
            >
              {t.label}
              {isActive(t.href) && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-lime" />}
            </Link>
          ))}
          <Link
            href={`${base}/gastos/nuevo`}
            className="ml-auto hidden shrink-0 rounded-xl bg-lime px-3.5 py-2 text-sm font-semibold text-ink transition hover:bg-lime-dim sm:inline-flex"
          >
            + Agregar gasto
          </Link>
        </div>
      </nav>
      {/* En el celular, botón flotante */}
      {!path.includes("/gastos/") && (
        <Link
          href={`${base}/gastos/nuevo`}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-2xl bg-lime px-5 py-3.5 font-semibold text-ink shadow-xl shadow-black/50 sm:hidden"
        >
          + Gasto
        </Link>
      )}
    </>
  );
}
