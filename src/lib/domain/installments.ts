import { cutoffForCharge, shiftCutoff, statementFor, type CardCycle, type Statement } from "./billing";
import type { ISODate } from "./dates";
import { allocate, type Cents } from "./money";
import { assertSharesMatch, type Share } from "./splits";

export interface Installment {
  /** 1 a N */
  number: number;
  of: number;
  statement: Statement;
  amount: Cents;
  shares: Share[];
}

/**
 * Montos de las mensualidades como las cobra el banco:
 * total ÷ N redondeado hacia abajo, y la última se lleva lo que sobra.
 */
export function installmentAmounts(total: Cents, count: number): Cents[] {
  if (!Number.isInteger(count) || count < 1 || count > 60) {
    throw new Error("El número de meses debe estar entre 1 y 60");
  }
  const base = Math.floor(total / count);
  return Array.from({ length: count }, (_, i) => (i === count - 1 ? total - base * (count - 1) : base));
}

/**
 * Calendario de una compra con tarjeta (contado = 1 mensualidad).
 *
 * Cada mensualidad se reparte entre las personas en proporción a su parte.
 * Se reparte sobre lo acumulado (no mes por mes) para que:
 *  - cada mensualidad sume exactamente lo que cobra el banco, y
 *  - lo que paga cada persona en total sume exactamente su parte.
 */
export function installmentSchedule(params: {
  date: ISODate;
  total: Cents;
  count: number;
  shares: Share[];
  cycle: CardCycle;
}): Installment[] {
  const { date, total, count, shares, cycle } = params;
  assertSharesMatch(total, shares);
  const amounts = installmentAmounts(total, count);
  const firstCutoff = cutoffForCharge(date, cycle.cutoffDay);
  const weights = shares.map((s) => s.amount);
  const allZero = weights.every((w) => w === 0);

  let cumulative = 0;
  let prevAlloc = shares.map(() => 0);
  return amounts.map((amount, i) => {
    cumulative += amount;
    const alloc = allZero ? shares.map(() => 0) : allocate(cumulative, weights);
    const pieces = alloc.map((v, j) => v - prevAlloc[j]);
    prevAlloc = alloc;
    return {
      number: i + 1,
      of: count,
      statement: statementFor(shiftCutoff(firstCutoff, i, cycle.cutoffDay), cycle),
      amount,
      shares: shares.map((s, j) => ({ userId: s.userId, amount: pieces[j] })),
    };
  });
}
