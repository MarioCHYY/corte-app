import { describe, expect, it } from "vitest";
import {
  allocate,
  balances,
  currentStatement,
  cutoffForCharge,
  formatMXN,
  installmentAmounts,
  installmentSchedule,
  parseMXN,
  simplifyDebts,
  splitEqual,
  splitExact,
  splitPercent,
  statementForCharge,
  statementSummary,
  upcomingStatements,
  type Card,
  type Expense,
  type Payment,
} from "./index";

const cycle = { cutoffDay: 5, dueDays: 20 };

describe("dinero", () => {
  it("reparte sin perder centavos", () => {
    expect(allocate(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocate(1000, [1, 3])).toEqual([250, 750]);
    expect(allocate(-100, [1, 1, 1])).toEqual([-34, -33, -33]);
  });
  it("convierte texto a centavos y de regreso", () => {
    expect(parseMXN("$1,234.5")).toBe(123450);
    expect(parseMXN("900")).toBe(90000);
    expect(() => parseMXN("12.345")).toThrow();
    expect(formatMXN(123450)).toMatch(/1,234\.50/);
  });
});

describe("fecha de corte (corte el 5, 20 días para pagar)", () => {
  it("un cargo antes del corte entra a ese corte", () => {
    expect(statementForCharge("2026-11-01", cycle)).toEqual({ periodStart: "2026-10-06", cutoff: "2026-11-05", dueDate: "2026-11-25" });
  });
  it("un cargo el mismo día del corte todavía entra", () => {
    expect(cutoffForCharge("2026-11-05", 5)).toBe("2026-11-05");
  });
  it("un cargo un día después del corte se va al siguiente mes", () => {
    expect(statementForCharge("2026-11-06", cycle)).toEqual({ periodStart: "2026-11-06", cutoff: "2026-12-05", dueDate: "2026-12-25" });
  });
  it("cambia de año bien", () => {
    expect(statementForCharge("2026-12-20", cycle).cutoff).toBe("2027-01-05");
    expect(statementForCharge("2027-01-03", cycle).dueDate).toBe("2027-01-25");
  });
  it("corte el 31 en meses cortos cae en el último día", () => {
    expect(cutoffForCharge("2027-02-10", 31)).toBe("2027-02-28");
    expect(cutoffForCharge("2028-02-10", 31)).toBe("2028-02-29");
    expect(cutoffForCharge("2027-03-01", 31)).toBe("2027-03-31");
    expect(statementForCharge("2027-03-01", { cutoffDay: 31, dueDays: 20 }).periodStart).toBe("2027-03-01");
  });
  it("el corte actual es el que todavía se puede pagar sin intereses", () => {
    expect(currentStatement("2026-11-10", cycle).cutoff).toBe("2026-11-05"); // ya cortó, vence el 25
    expect(currentStatement("2026-11-26", cycle).cutoff).toBe("2026-12-05"); // ya venció, sigue el próximo
    expect(currentStatement("2026-11-05", cycle).cutoff).toBe("2026-11-05");
  });
  it("lista los próximos cortes", () => {
    expect(upcomingStatements("2026-11-06", cycle, 3).map((s) => s.cutoff)).toEqual(["2026-12-05", "2027-01-05", "2027-02-05"]);
  });
});

describe("divisiones", () => {
  it("igual entre tres", () => {
    expect(splitEqual(90000, ["ana", "beto", "carlos"]).map((s) => s.amount)).toEqual([30000, 30000, 30000]);
    expect(splitEqual(100, ["ana", "beto", "carlos"]).map((s) => s.amount)).toEqual([34, 33, 33]);
  });
  it("montos exactos deben sumar el total", () => {
    expect(() => splitExact(1000, { ana: 500, beto: 400 })).toThrow();
    expect(splitExact(1000, { ana: 600, beto: 400 })).toHaveLength(2);
  });
  it("porcentajes en puntos base", () => {
    expect(splitPercent(10000, { ana: 5000, beto: 2500, carlos: 2500 }).map((s) => s.amount)).toEqual([5000, 2500, 2500]);
    expect(() => splitPercent(10000, { ana: 5000 })).toThrow();
  });
});

describe("meses sin intereses", () => {
  it("la última mensualidad se lleva los centavos", () => {
    expect(installmentAmounts(1000000, 12).slice(-2)).toEqual([83333, 83337]);
    expect(installmentAmounts(1000000, 12).reduce((a, b) => a + b)).toBe(1000000);
  });
  it("refri de $12,000 a 12 meses entre dos hermanos", () => {
    const sched = installmentSchedule({
      date: "2026-11-06",
      total: 1200000,
      count: 12,
      shares: splitEqual(1200000, ["mario", "hermano"]),
      cycle,
    });
    expect(sched).toHaveLength(12);
    expect(sched[0].statement.cutoff).toBe("2026-12-05");
    expect(sched[11].statement.cutoff).toBe("2027-11-05");
    expect(sched[0].shares.map((s) => s.amount)).toEqual([50000, 50000]);
  });
  it("con montos raros todo sigue cuadrando por mes y por persona", () => {
    const shares = splitEqual(1000001, ["a", "b", "c"]);
    const sched = installmentSchedule({ date: "2026-11-01", total: 1000001, count: 7, shares, cycle });
    for (const i of sched) expect(i.shares.reduce((a, s) => a + s.amount, 0)).toBe(i.amount);
    for (const s of shares) {
      const paid = sched.reduce((a, i) => a + i.shares.find((x) => x.userId === s.userId)!.amount, 0);
      expect(paid).toBe(s.amount);
    }
    expect(sched.every((i) => i.shares.every((s) => s.amount >= 0))).toBe(true);
  });
});

describe("estado de cuenta de la tarjeta de Perla", () => {
  const card: Card = { id: "tdc", holderId: "perla", cycle };
  const people = ["perla", "mario", "beto"];
  const expenses: Expense[] = [
    { id: "luz", description: "Luz", amount: 90000, date: "2026-11-01", paidBy: { kind: "card", cardId: "tdc" }, installments: 1, shares: splitEqual(90000, people) },
    { id: "aud", description: "Audífonos", amount: 80000, date: "2026-10-20", paidBy: { kind: "card", cardId: "tdc" }, installments: 1, shares: [{ userId: "mario", amount: 80000 }] },
    { id: "cel", description: "Celular", amount: 600000, date: "2026-09-15", paidBy: { kind: "card", cardId: "tdc" }, installments: 6, shares: [{ userId: "beto", amount: 600000 }] },
    { id: "int", description: "Internet", amount: 60000, date: "2026-11-06", paidBy: { kind: "card", cardId: "tdc" }, installments: 1, shares: splitEqual(60000, people) },
    { id: "pizza", description: "Pizza", amount: 30000, date: "2026-11-02", paidBy: { kind: "user", userId: "mario" }, installments: 1, shares: splitEqual(30000, people) },
  ];
  const payments: Payment[] = [{ id: "p1", fromUserId: "mario", toUserId: "perla", amount: 50000, date: "2026-11-10", cardId: "tdc", cutoff: "2026-11-05" }];

  const sum = statementSummary({ card, cutoff: "2026-11-05", expenses, payments });
  const get = (u: string) => sum.people.find((p) => p.userId === u)!;

  it("solo cuenta lo que cae en ese corte", () => {
    // luz 900 + audífonos 800 + mensualidad 2 del celular 1000 (el internet del 6 se va a diciembre)
    expect(sum.total).toBe(90000 + 80000 + 100000);
    expect(sum.statement.dueDate).toBe("2026-11-25");
  });
  it("calcula lo que debe cada quien y lo que le falta", () => {
    expect(get("mario")).toMatchObject({ owed: 110000, paid: 50000, pending: 60000 });
    expect(get("beto")).toMatchObject({ owed: 130000, paid: 0, pending: 130000 });
    expect(get("beto").lines.find((l) => l.expenseId === "cel")?.installment).toEqual({ number: 2, of: 6 });
    expect(get("perla")).toMatchObject({ owed: 30000, pending: 0, isHolder: true });
    expect(sum.pendingToHolder).toBe(190000);
  });
  it("saldos generales suman cero y se simplifican", () => {
    const bal = balances({ expenses, payments, cards: [card] });
    expect([...bal.values()].reduce((a, b) => a + b, 0)).toBe(0);
    const transfers = simplifyDebts(bal);
    const after = new Map(bal);
    for (const t of transfers) {
      after.set(t.from, after.get(t.from)! + t.amount);
      after.set(t.to, after.get(t.to)! - t.amount);
    }
    expect([...after.values()].every((v) => v === 0)).toBe(true);
    expect(transfers.length).toBeLessThanOrEqual(2);
  });
  it("con asOf solo cuentan las mensualidades que ya cortaron", () => {
    const bal = balances({ expenses: [expenses[2]], payments: [], cards: [card], asOf: "2026-11-05" });
    expect(bal.get("beto")).toBe(-200000); // mensualidades de octubre y noviembre
  });
});
