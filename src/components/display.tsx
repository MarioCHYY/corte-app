import { formatDateLong, formatMXN, type ISODate } from "@/lib/domain";

const AVATAR_COLORS = ["#C6F432", "#FF5C5C", "#7DD3FC", "#FBBF24", "#C4B5FD", "#6EE7B7", "#F9A8D4", "#FDBA74"];

/** Color estable por id para que cada persona siempre tenga el mismo. */
function colorFor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function Avatar({ id, name, size = 32 }: { id: string; name: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-ink"
      style={{ width: size, height: size, background: colorFor(id), fontSize: size * 0.42 }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export function Money({ cents, className = "", sign = false }: { cents: number; className?: string; sign?: boolean }) {
  const text = formatMXN(Math.abs(cents));
  const prefix = sign && cents !== 0 ? (cents > 0 ? "+" : "−") : cents < 0 ? "−" : "";
  return <span className={`tabular ${className}`}>{prefix + text}</span>;
}

export function DateText({ date, year = false }: { date: ISODate; year?: boolean }) {
  return <time dateTime={date}>{formatDateLong(date, { year })}</time>;
}

export function daysLabel(days: number): string {
  if (days < 0) return `venció hace ${-days} ${-days === 1 ? "día" : "días"}`;
  if (days === 0) return "vence hoy";
  if (days === 1) return "vence mañana";
  return `faltan ${days} días`;
}

export function Progress({ value, max, tone = "lime" }: { value: number; max: number; tone?: "lime" | "coral" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 100;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${tone === "lime" ? "bg-lime" : "bg-coral"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export const KIND_LABEL = { shared: "Compartido", personal: "Personal", gift: "Regalo" } as const;
