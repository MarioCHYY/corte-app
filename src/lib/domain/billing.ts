import { addDays, addMonthsYM, daysInMonth, parseDate, toISODate, type ISODate } from "./dates";

/** Configuración del ciclo de una tarjeta. */
export interface CardCycle {
  /** Día de corte, 1 a 31. Si el mes es más corto, el corte es el último día del mes. */
  cutoffDay: number;
  /** Días entre el corte y la fecha límite para no generar intereses (normalmente 20). */
  dueDays: number;
}

export interface Statement {
  /** Primer día del periodo (día siguiente al corte anterior). */
  periodStart: ISODate;
  /** Fecha de corte: último día del periodo. */
  cutoff: ISODate;
  /** Fecha límite para pagar sin intereses. */
  dueDate: ISODate;
}

export function validateCycle({ cutoffDay, dueDays }: CardCycle): void {
  if (!Number.isInteger(cutoffDay) || cutoffDay < 1 || cutoffDay > 31) {
    throw new Error("El día de corte debe estar entre 1 y 31");
  }
  if (!Number.isInteger(dueDays) || dueDays < 1 || dueDays > 60) {
    throw new Error("Los días para pagar deben estar entre 1 y 60");
  }
}

/** Fecha de corte dentro de un mes concreto. */
export function cutoffInMonth(y: number, m: number, cutoffDay: number): ISODate {
  return toISODate(y, m, Math.min(cutoffDay, daysInMonth(y, m)));
}

/** Corte en el que entra un cargo: el primer corte igual o posterior a la fecha. */
export function cutoffForCharge(date: ISODate, cutoffDay: number): ISODate {
  const { y, m } = parseDate(date);
  const thisMonth = cutoffInMonth(y, m, cutoffDay);
  if (date <= thisMonth) return thisMonth;
  const next = addMonthsYM(y, m, 1);
  return cutoffInMonth(next.y, next.m, cutoffDay);
}

/** Corte que está `months` meses después de otro corte. */
export function shiftCutoff(cutoff: ISODate, months: number, cutoffDay: number): ISODate {
  const { y, m } = parseDate(cutoff);
  const t = addMonthsYM(y, m, months);
  return cutoffInMonth(t.y, t.m, cutoffDay);
}

/** Estado de cuenta completo a partir de su fecha de corte. */
export function statementFor(cutoff: ISODate, cycle: CardCycle): Statement {
  validateCycle(cycle);
  const prev = shiftCutoff(cutoff, -1, cycle.cutoffDay);
  return { periodStart: addDays(prev, 1), cutoff, dueDate: addDays(cutoff, cycle.dueDays) };
}

/** Estado de cuenta en el que entra un cargo hecho en `date`. */
export function statementForCharge(date: ISODate, cycle: CardCycle): Statement {
  return statementFor(cutoffForCharge(date, cycle.cutoffDay), cycle);
}

/**
 * El estado de cuenta "actual": el que todavía se puede pagar sin intereses.
 * Si hoy ya pasó el corte pero no la fecha límite, es ese; si ya pasó la
 * fecha límite, es el siguiente.
 */
export function currentStatement(todayDate: ISODate, cycle: CardCycle): Statement {
  const upcoming = cutoffForCharge(todayDate, cycle.cutoffDay);
  // último corte que ya cerró (hoy cuenta como cerrado si hoy es día de corte)
  const lastClosed = upcoming === todayDate ? upcoming : shiftCutoff(upcoming, -1, cycle.cutoffDay);
  const last = statementFor(lastClosed, cycle);
  if (todayDate <= last.dueDate) return last;
  return statementFor(shiftCutoff(lastClosed, 1, cycle.cutoffDay), cycle);
}

/** Los próximos `count` cortes empezando por el de una fecha. */
export function upcomingStatements(from: ISODate, cycle: CardCycle, count: number): Statement[] {
  const first = cutoffForCharge(from, cycle.cutoffDay);
  return Array.from({ length: count }, (_, i) => statementFor(shiftCutoff(first, i, cycle.cutoffDay), cycle));
}
