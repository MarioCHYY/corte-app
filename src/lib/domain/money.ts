/** Dinero en centavos enteros. $1,234.50 → 123450 */
export type Cents = number;

function assertCents(value: number, name = "monto"): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${name} debe ser un entero en centavos (recibí ${value})`);
  }
}

/**
 * Reparte `total` en partes proporcionales a `weights` sin perder centavos
 * (método del residuo mayor). Los centavos sobrantes van a quien tenga el
 * residuo más grande; en empate, al que aparece primero. Determinista.
 */
export function allocate(total: Cents, weights: number[]): Cents[] {
  assertCents(total, "total");
  if (weights.length === 0) throw new Error("No hay entre quién repartir");
  if (weights.some((w) => w < 0 || !Number.isFinite(w))) {
    throw new Error("Los pesos no pueden ser negativos");
  }
  const sumW = weights.reduce((a, b) => a + b, 0);
  if (sumW === 0) throw new Error("La suma de los pesos es 0");

  const sign = total < 0 ? -1 : 1;
  const abs = Math.abs(total);
  const raw = weights.map((w) => (abs * w) / sumW);
  const base = raw.map(Math.floor);
  let left = abs - base.reduce((a, b) => a + b, 0);

  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    base[i] += 1;
    left -= 1;
  }
  return base.map((v) => v * sign);
}

/** Reparte en partes iguales; los centavos sobrantes van a los primeros. */
export function splitEvenly(total: Cents, parts: number): Cents[] {
  if (!Number.isInteger(parts) || parts < 1) throw new Error("Partes inválidas");
  return allocate(total, Array(parts).fill(1));
}

const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function formatMXN(cents: Cents): string {
  return mxn.format(cents / 100);
}

/** "1,234.50" o "1234.5" → 123450 */
export function parseMXN(input: string): Cents {
  const clean = input.replace(/[$,\s]/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(clean)) throw new Error(`Monto inválido: "${input}"`);
  const [int, dec = ""] = clean.replace("-", "").split(".");
  const cents = Number(int) * 100 + Number(dec.padEnd(2, "0"));
  return clean.startsWith("-") ? -cents : cents;
}
