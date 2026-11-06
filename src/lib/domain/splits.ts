import { allocate, formatMXN, splitEvenly, type Cents } from "./money";

export interface Share {
  userId: string;
  amount: Cents;
}

/** Divide igual entre las personas; los centavos sobrantes van a las primeras. */
export function splitEqual(total: Cents, userIds: string[]): Share[] {
  assertUnique(userIds);
  const parts = splitEvenly(total, userIds.length);
  return userIds.map((userId, i) => ({ userId, amount: parts[i] }));
}

/** Montos exactos: tienen que sumar el total. */
export function splitExact(total: Cents, amounts: Record<string, Cents>): Share[] {
  const shares = Object.entries(amounts).map(([userId, amount]) => ({ userId, amount }));
  if (shares.length === 0) throw new Error("No hay entre quién dividir");
  if (shares.some((s) => !Number.isSafeInteger(s.amount) || s.amount < 0)) {
    throw new Error("Los montos deben ser centavos positivos");
  }
  const sum = shares.reduce((a, s) => a + s.amount, 0);
  if (sum !== total) throw new Error(`Las partes suman ${formatMXN(sum)} y el total es ${formatMXN(total)}`);
  return shares;
}

/**
 * Porcentajes en puntos base (100 % = 10000, 33.33 % = 3333) para no usar
 * decimales. Tienen que sumar 10000.
 */
export function splitPercent(total: Cents, basisPoints: Record<string, number>): Share[] {
  const entries = Object.entries(basisPoints);
  if (entries.length === 0) throw new Error("No hay entre quién dividir");
  const sum = entries.reduce((a, [, bp]) => a + bp, 0);
  if (sum !== 10000) throw new Error(`Los porcentajes suman ${sum / 100}% y deben sumar 100%`);
  const parts = allocate(total, entries.map(([, bp]) => bp));
  return entries.map(([userId], i) => ({ userId, amount: parts[i] }));
}

/** Todo a una sola persona (gasto personal o regalo). */
export function splitSingle(total: Cents, userId: string): Share[] {
  return [{ userId, amount: total }];
}

export function assertSharesMatch(total: Cents, shares: Share[]): void {
  const sum = shares.reduce((a, s) => a + s.amount, 0);
  if (sum !== total) throw new Error(`Las partes suman ${formatMXN(sum)} y el total es ${formatMXN(total)}`);
}

function assertUnique(ids: string[]) {
  if (new Set(ids).size !== ids.length) throw new Error("Hay personas repetidas en la división");
}
