import Link from "next/link";
import { Icon } from "@/components/icons";

/** Piezas de las pantallas de ajustes con estilo de app móvil. */

export function SettingsHeader({ title, subtitle, back = "/cuenta", backLabel = "Mi cuenta" }: { title: string; subtitle?: string; back?: string; backLabel?: string }) {
  return (
    <div className="mb-6">
      <Link href={back} className="inline-flex items-center gap-1 text-sm text-mute hover:text-paper">
        <Icon name="chevronLeft" className="h-4 w-4" /> {backLabel}
      </Link>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-mute">{subtitle}</p>}
    </div>
  );
}

export function SettingsGroup({ title, children, footer }: { title?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <section className="mb-6">
      {title && <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-mute">{title}</h2>}
      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-slate-2">{children}</div>
      {footer && <p className="mt-2 px-1 text-xs text-mute">{footer}</p>}
    </section>
  );
}

interface RowProps {
  icon: React.ReactNode;
  label: string;
  detail?: string;
  value?: React.ReactNode;
  href?: string;
  external?: boolean;
  tone?: "default" | "danger";
}

export function SettingsRow({ icon, label, detail, value, href, external, tone = "default" }: RowProps) {
  const body = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone === "danger" ? "bg-coral/15 text-coral" : "bg-slate text-paper/80"}`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block font-medium ${tone === "danger" ? "text-coral" : ""}`}>{label}</span>
        {detail && <span className="block truncate text-sm text-mute">{detail}</span>}
      </span>
      {value && <span className="shrink-0 text-sm text-mute">{value}</span>}
      {href && (
        <Icon name={external ? "external" : "chevronRight"} className="h-4 w-4 text-mute" />
      )}
    </>
  );
  const cls = "flex items-center gap-3 px-4 py-3.5";
  if (!href) return <div className={cls}>{body}</div>;
  if (external || href.startsWith("mailto:") || href.startsWith("/api/")) {
    return (
      <a href={href} className={`${cls} transition hover:bg-slate/60`} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
        {body}
      </a>
    );
  }
  return (
    <Link href={href} className={`${cls} transition hover:bg-slate/60`}>
      {body}
    </Link>
  );
}
