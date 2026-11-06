"use client";

import { useState, useSyncExternalStore } from "react";
import { formatDateLong, formatMXN, installmentSchedule, splitEqual, today } from "@/lib/domain";

const OPTIONS = [3, 6, 12];
const TOTAL = 1200000; // $12,000
const noop = () => () => {};

/** Un refri de $12,000 entre Mario y Beto: elige los meses y mira el calendario. */
export function MsiDemo() {
  const now = useSyncExternalStore(noop, () => today(), () => "");
  const [months, setMonths] = useState(12);
  if (!now) return <div className="h-[360px] rounded-3xl bg-slate-2/60" aria-hidden />;

  const schedule = installmentSchedule({
    date: now,
    total: TOTAL,
    count: months,
    shares: splitEqual(TOTAL, ["mario", "beto"]),
    cycle: { cutoffDay: 5, dueDays: 20 },
  });

  return (
    <div className="rounded-3xl border border-line bg-slate-2 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Refrigerador, {formatMXN(TOTAL)}</p>
          <p className="text-sm text-mute">Entre Mario y Beto, con la tarjeta de Perla</p>
        </div>
        <div className="flex rounded-full bg-ink p-1" role="radiogroup" aria-label="Meses sin intereses">
          {OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={m === months}
              onClick={() => setMonths(m)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${m === months ? "bg-lime text-ink" : "text-paper/70 hover:text-paper"}`}
            >
              {m} meses
            </button>
          ))}
        </div>
      </div>
      <ol className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {schedule.map((i) => (
          <li key={i.number} className="rounded-xl bg-ink px-3 py-2.5">
            <p className="text-xs text-mute">
              {i.number} de {i.of}
            </p>
            <p className="font-display font-bold tabular">{formatMXN(i.amount)}</p>
            <p className="text-[11px] text-mute">antes del {formatDateLong(i.statement.dueDate, { year: false })}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-paper/75">
        Cada uno pone <b className="text-paper tabular">{formatMXN(schedule[0].shares[0].amount)}</b> al mes. La última mensualidad se lleva los centavos
        que sobran, igual que en el banco.
      </p>
    </div>
  );
}
