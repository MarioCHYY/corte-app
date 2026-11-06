import { z } from "zod";
import { parseMXN, splitEqual, splitExact, splitPercent, type Share } from "@/lib/domain";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

export const moneySchema = z
  .string()
  .trim()
  .transform((v, ctx) => {
    try {
      const cents = parseMXN(v);
      if (cents <= 0) throw new Error();
      if (cents > 100_000_000_00) throw new Error();
      return cents;
    } catch {
      ctx.addIssue({ code: "custom", message: "Escribe un monto válido, por ejemplo 1,250.50" });
      return z.NEVER;
    }
  });

/** "33.33" → 3333 puntos base */
function percentToBp(v: string): number {
  const n = Number(v.replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error("Porcentaje inválido");
  return Math.round(n * 100);
}

export const expenseInputSchema = z.object({
  description: z.string().trim().min(1, "Escribe qué fue").max(120),
  amount: moneySchema,
  date: isoDate,
  kind: z.enum(["shared", "personal", "gift"]),
  paid: z.discriminatedUnion("type", [
    z.object({ type: z.literal("card"), cardId: z.string().min(1) }),
    z.object({ type: z.literal("member"), memberId: z.string().min(1) }),
  ]),
  installments: z.coerce.number().int().min(1).max(48),
  giftFor: z.string().trim().max(60).optional(),
  split: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("equal"), memberIds: z.array(z.string()).min(1, "Elige al menos a una persona") }),
    z.object({ mode: z.literal("exact"), amounts: z.record(z.string(), z.string()) }),
    z.object({ mode: z.literal("percent"), percents: z.record(z.string(), z.string()) }),
    z.object({ mode: z.literal("single"), memberId: z.string().min(1, "Elige a la persona") }),
  ]),
});

export type ExpenseInput = z.input<typeof expenseInputSchema>;
export type ParsedExpense = z.output<typeof expenseInputSchema>;

/** Calcula las partes en centavos a partir de lo que mandó el formulario. */
export function computeShares(e: ParsedExpense): { shares: (Share & { basisPoints?: number })[]; splitMode: "equal" | "exact" | "percent" } {
  const s = e.split;
  switch (s.mode) {
    case "equal":
      return { shares: splitEqual(e.amount, s.memberIds), splitMode: "equal" };
    case "single":
      return { shares: [{ userId: s.memberId, amount: e.amount }], splitMode: "exact" };
    case "exact": {
      const amounts: Record<string, number> = {};
      for (const [id, v] of Object.entries(s.amounts)) {
        if (!v.trim()) continue;
        const cents = parseMXN(v);
        if (cents < 0) throw new Error("Los montos no pueden ser negativos");
        if (cents > 0) amounts[id] = cents;
      }
      return { shares: splitExact(e.amount, amounts), splitMode: "exact" };
    }
    case "percent": {
      const bp: Record<string, number> = {};
      for (const [id, v] of Object.entries(s.percents)) {
        if (!v.trim()) continue;
        const b = percentToBp(v);
        if (b > 0) bp[id] = b;
      }
      const shares = splitPercent(e.amount, bp).map((sh) => ({ ...sh, basisPoints: bp[sh.userId] }));
      return { shares, splitMode: "percent" };
    }
  }
}
