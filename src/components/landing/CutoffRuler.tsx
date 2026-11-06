"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  addDays,
  daysBetween,
  formatDateLong,
  parseDate,
  shiftCutoff,
  statementForCharge,
  today,
  type ISODate,
} from "@/lib/domain";

/**
 * La regla del corte: una línea de tiempo de tres estados de cuenta donde
 * arrastras la fecha de una compra y ves en qué corte cae y cuándo se paga.
 */

const CUTOFF_DAYS = [5, 12, 20, 28];
const DUE_DAYS = 20;
const PERIODS = 3;

const noop = () => () => {};
const useToday = () => useSyncExternalStore(noop, () => today(), () => "");
const useReducedMotion = () =>
  useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );

const short = (d: ISODate) => formatDateLong(d, { year: false });
const tiny = (d: ISODate) =>
  new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(d + "T12:00:00Z")).replace(".", "");
/** Alinea una etiqueta para que no se salga por los lados */
const edge = (p: number) => (p < 10 ? "translate-x-0" : p > 90 ? "-translate-x-full" : "-translate-x-1/2");

export function CutoffRuler() {
  const now = useToday();
  const reduced = useReducedMotion();
  const [cutoffDay, setCutoffDay] = useState(5);
  const [offset, setOffset] = useState<number | null>(null);
  const [intro, setIntro] = useState<number | null>(null);
  const playedRef = useRef(false);

  if (!now) return <div className="h-[420px] rounded-[28px] bg-slate-2/60" aria-hidden />;

  const cycle = { cutoffDay, dueDays: DUE_DAYS };
  const first = statementForCharge(now, cycle);
  const start = first.periodStart;
  const lastCutoff = shiftCutoff(first.cutoff, PERIODS - 1, cutoffDay);
  const total = daysBetween(start, lastCutoff); // índice del último día
  const todayIdx = daysBetween(start, now);

  return (
    <RulerInner
      key={cutoffDay}
      {...{ now, reduced, cutoffDay, setCutoffDay, start, total, todayIdx, first: first.cutoff, offset, setOffset, intro, setIntro, playedRef }}
    />
  );
}

interface InnerProps {
  now: ISODate;
  reduced: boolean;
  cutoffDay: number;
  setCutoffDay: (d: number) => void;
  start: ISODate;
  total: number;
  todayIdx: number;
  first: ISODate;
  offset: number | null;
  setOffset: (n: number | null) => void;
  intro: number | null;
  setIntro: (n: number | null) => void;
  playedRef: React.RefObject<boolean>;
}

function RulerInner({ now, reduced, cutoffDay, setCutoffDay, start, total, todayIdx, first, offset, setOffset, intro, setIntro, playedRef }: InnerProps) {
  const cycle = { cutoffDay, dueDays: DUE_DAYS };

  // Animación de entrada: la compra cruza el día de corte y se acomoda en hoy
  useEffect(() => {
    if (reduced || playedRef.current) return;
    playedRef.current = true;
    const from = Math.max(0, daysBetween(start, first) - 4);
    const to = Math.min(total, daysBetween(start, first) + 2);
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1800);
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      setIntro(Math.round(from + (to - from) * e));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setIntro(null), 300);
    };
    const delay = setTimeout(() => (raf = requestAnimationFrame(tick)), 600);
    return () => {
      clearTimeout(delay);
      cancelAnimationFrame(raf);
    };
  }, [reduced, playedRef, start, first, total, setIntro]);

  const value = intro ?? offset ?? Math.min(total, Math.max(0, todayIdx));
  const purchase = addDays(start, value);
  const st = statementForCharge(purchase, cycle);
  const days = daysBetween(purchase, st.dueDate);
  const pct = (i: number) => (i / total) * 100;

  const cutoffs = Array.from({ length: PERIODS }, (_, i) => shiftCutoff(first, i, cutoffDay));
  const months: { label: string; idx: number }[] = [];
  for (let i = 0; i <= total; i++) {
    const d = addDays(start, i);
    if (parseDate(d).day === 1) {
      const m = new Intl.DateTimeFormat("es-MX", { month: "long", timeZone: "UTC" }).format(new Date(d + "T12:00:00Z"));
      months.push({ label: m.charAt(0).toUpperCase() + m.slice(1), idx: i });
    }
  }
  const isCutoffDay = purchase === st.cutoff;
  const dayAfter = cutoffs.some((c) => addDays(c, 1) === purchase);
  const periodStartIdx = daysBetween(start, st.periodStart);
  const periodEndIdx = daysBetween(start, st.cutoff);

  return (
    <div className="rounded-[28px] border border-line bg-slate-2 p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mute">Arrastra la fecha de la compra</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-mute">Mi tarjeta corta el día</span>
          <div className="flex rounded-full bg-ink p-1" role="radiogroup" aria-label="Día de corte">
            {CUTOFF_DAYS.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={d === cutoffDay}
                onClick={() => {
                  setOffset(null);
                  setCutoffDay(d);
                }}
                className={`h-8 min-w-8 rounded-full px-2 font-semibold tabular transition ${d === cutoffDay ? "bg-lime text-ink" : "text-paper/70 hover:text-paper"}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* La regla */}
      <div className="relative mt-8 select-none rounded-xl pb-2 pt-16 outline-offset-4 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-lime">
        {/* periodo en el que cae la compra */}
        <div
          className="absolute top-12 h-14 rounded-lg bg-lime/10 transition-all duration-300"
          style={{ left: `${pct(Math.max(0, periodStartIdx))}%`, width: `${pct(periodEndIdx - Math.max(0, periodStartIdx))}%` }}
          aria-hidden
        />
        {/* marcas de días */}
        <div className="relative h-14" aria-hidden>
          {Array.from({ length: total + 1 }, (_, i) => {
            const d = addDays(start, i);
            const isFirst = parseDate(d).day === 1;
            return (
              <span
                key={i}
                className={`absolute bottom-3 w-px ${isFirst ? "h-6 bg-paper/50" : "h-2.5 bg-paper/20"}`}
                style={{ left: `${pct(i)}%` }}
              />
            );
          })}
          {/* cortes */}
          {cutoffs.map((c) => {
            const i = daysBetween(start, c);
            const active = c === st.cutoff;
            return (
              <div key={c} className="absolute -top-14 bottom-0" style={{ left: `${pct(i)}%` }}>
                <span className={`absolute bottom-0 top-6 w-0.5 -translate-x-1/2 ${active ? "bg-lime" : "bg-paper/30"}`} />
                <span
                  className={`absolute top-0 ${edge(pct(i))} whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? "bg-lime text-ink" : "bg-ink text-paper/60"}`}
                >
                  <span className="hidden sm:inline">Corte </span>
                  {tiny(c)}
                </span>
              </div>
            );
          })}
          {/* fecha límite del corte activo */}
          {(() => {
            const i = daysBetween(start, st.dueDate);
            if (i > total) return null;
            return (
              <div className="absolute bottom-0 top-3" style={{ left: `${pct(i)}%` }}>
                <span className="absolute bottom-3 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-coral" />
                <span className={`absolute -bottom-6 ${edge(pct(i))} whitespace-nowrap text-[11px] font-semibold text-coral`}>Pagar {tiny(st.dueDate)}</span>
              </div>
            );
          })()}
          {/* compra */}
          <div className="pointer-events-none absolute bottom-0 top-0 transition-[left] duration-75" style={{ left: `${pct(value)}%` }}>
            <span className="absolute bottom-3 h-12 w-0.5 -translate-x-1/2 bg-paper" />
            <span className={`absolute bottom-[3.6rem] ${edge(pct(value))} whitespace-nowrap rounded-lg bg-paper px-2 py-1 text-xs font-bold text-ink shadow-lg`}>
              Compra {tiny(purchase)}
            </span>
            <span className="absolute bottom-1.5 h-4 w-4 -translate-x-1/2 rounded-full border-[3px] border-paper bg-ink" />
          </div>
        </div>
        {/* meses */}
        <div className="relative mt-6 h-5 text-xs text-mute" aria-hidden>
          {months.map((m) => (
            <span key={m.idx} className="absolute" style={{ left: `${pct(m.idx)}%` }}>
              {m.label}
            </span>
          ))}
        </div>
        {/* control accesible */}
        <input
          type="range"
          min={0}
          max={total}
          value={value}
          onChange={(e) => {
            setIntro(null);
            setOffset(Number(e.target.value));
          }}
          aria-label="Fecha de la compra"
          aria-valuetext={formatDateLong(purchase)}
          className="ruler-input absolute inset-x-0 top-10 h-24 w-full cursor-ew-resize opacity-0"
        />
      </div>

      {/* Resultado */}
      <div className="mt-6 grid gap-4 border-t border-line pt-6 sm:grid-cols-[1.4fr_1fr]" aria-live="polite">
        <div>
          <p className="text-sm text-mute">
            {isCutoffDay
              ? "Justo el día de corte: todavía entra en este estado de cuenta."
              : dayAfter
                ? "Un día después del corte: se va hasta el siguiente."
                : purchase === now
                  ? "Si compras hoy"
                  : `Si compras el ${formatDateLong(purchase, { year: false })}`}
          </p>
          <p className="mt-1 font-display text-2xl font-bold leading-tight sm:text-3xl">
            Entra al corte del {short(st.cutoff)} y lo pagas antes del {short(st.dueDate)}.
          </p>
        </div>
        <div className="flex items-end gap-3 sm:justify-end">
          <p className="font-display text-6xl font-bold leading-none tracking-tight text-lime tabular">{days}</p>
          <p className="pb-1 text-sm leading-snug text-mute">
            días para juntar
            <br />
            el dinero
          </p>
        </div>
      </div>
    </div>
  );
}
