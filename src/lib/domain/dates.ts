/**
 * Fechas de calendario sin hora ni zona horaria, como texto "AAAA-MM-DD".
 * Un cargo del 5 de noviembre es del 5 de noviembre en cualquier zona horaria.
 */
export type ISODate = string;

const RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDate(d: ISODate): { y: number; m: number; day: number } {
  const match = RE.exec(d);
  if (!match) throw new Error(`Fecha inválida: "${d}" (usa AAAA-MM-DD)`);
  const y = Number(match[1]);
  const m = Number(match[2]);
  const day = Number(match[3]);
  if (m < 1 || m > 12 || day < 1 || day > daysInMonth(y, m)) {
    throw new Error(`Fecha inválida: "${d}"`);
  }
  return { y, m, day };
}

export function toISODate(y: number, m: number, day: number): ISODate {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** m de 1 a 12 */
export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function addDays(d: ISODate, days: number): ISODate {
  const { y, m, day } = parseDate(d);
  const t = new Date(Date.UTC(y, m - 1, day + days));
  return toISODate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** Suma meses a un año/mes. Devuelve {y, m} con m de 1 a 12. */
export function addMonthsYM(y: number, m: number, months: number): { y: number; m: number } {
  const idx = y * 12 + (m - 1) + months;
  return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
}

export function compareDates(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Días de a hasta b (positivo si b es después). */
export function daysBetween(a: ISODate, b: ISODate): number {
  const pa = parseDate(a);
  const pb = parseDate(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.day) - Date.UTC(pa.y, pa.m - 1, pa.day)) / 86_400_000);
}

/** "25 de noviembre de 2026" (o sin año con { year: false }) */
export function formatDateLong(d: ISODate, opts: { year?: boolean } = {}): string {
  const { y, m, day } = parseDate(d);
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    ...(opts.year === false ? {} : { year: "numeric" }),
  }).format(new Date(Date.UTC(y, m - 1, day)));
}

/** Fecha de hoy en una zona horaria dada (por defecto la del centro de México). */
export function today(timeZone = "America/Mexico_City"): ISODate {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
