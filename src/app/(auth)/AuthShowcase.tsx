"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CorteIcon } from "@/components/brand/Logo";
import { Icon } from "@/components/icons";

/**
 * Demo animado del panel de entrar: 4 escenas en bucle que cuentan cómo
 * funciona corte. Todo se calcula a partir de un solo reloj `t` (ms), así
 * cada cuadro es determinista y no depende de clases CSS dinámicas.
 * Con "reducir movimiento" se muestra una escena fija.
 */

const LIME = "#C6F432";
const CORAL = "#FF5C5C";
const INK = "#121417";
const LINE = "#33373f";
const SLATE = "#2a2e35";
const MUTE = "#9aa0a8";

const SCENES = [
  { title: "Registras el gasto", dur: 4400 },
  { title: "corte lo acomoda en su corte", dur: 4600 },
  { title: "Cada quien sabe cuánto y cuándo", dur: 4800 },
  { title: "Todos a mano, sin intereses", dur: 3600 },
];
const STARTS = SCENES.map((_, i) => SCENES.slice(0, i).reduce((a, s) => a + s.dur, 0));
const TOTAL = SCENES.reduce((a, s) => a + s.dur, 0);

// ---------- utilidades de animación ----------
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const outCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const outBack = (x: number) => {
  const c = 1.7;
  return x <= 0 ? 0 : 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};
const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
const money = (n: number) => "$" + Math.round(n).toLocaleString("es-MX");

/** Entrada con rebote: opacidad + desplazamiento + escala. */
function enter(t: number, at: number, dur = 450, dy = 18): React.CSSProperties {
  const p = seg(t, at, at + dur);
  return { opacity: clamp(p * 2), transform: `translateY(${(1 - outBack(p)) * dy}px) scale(${lerp(0.94, 1, outBack(p))})` };
}

const QUERY = "(prefers-reduced-motion: reduce)";
function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

function useClock(paused: boolean) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (paused) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT((now - start) % TOTAL);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused]);
  return t;
}

// ---------- componente principal ----------
export function AuthShowcase() {
  const reduced = useReducedMotion();
  const clock = useClock(reduced);
  const t = reduced ? STARTS[2] + 4000 : clock;
  let scene = 0;
  for (let i = 0; i < STARTS.length; i++) if (t >= STARTS[i]) scene = i;
  const local = t - STARTS[scene];
  const dur = SCENES[scene].dur;
  // Transición entre escenas
  const fadeIn = seg(local, 0, 350);
  const fadeOut = 1 - seg(local, dur - 300, dur);
  const visible = reduced ? 1 : Math.min(fadeIn, fadeOut);
  const sceneStyle: React.CSSProperties = {
    opacity: visible,
    transform: reduced ? undefined : `translateY(${(1 - outCubic(fadeIn)) * 10}px)`,
  };

  return (
    <div className="mt-8" aria-hidden>
      {/* Barras tipo historias */}
      <div className="flex gap-1.5">
        {SCENES.map((s, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: SLATE }}>
            <div
              className="h-full rounded-full"
              style={{ background: LIME, width: `${i < scene ? 100 : i === scene ? (reduced ? 100 : seg(local, 0, dur) * 100) : 0}%` }}
            />
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm font-medium" style={{ opacity: visible }}>
        <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: LIME, color: INK }}>
          {scene + 1}
        </span>
        {SCENES[scene].title}
      </p>

      <div
        className="relative mt-3 h-[340px] overflow-hidden rounded-3xl border p-5 shadow-2xl shadow-black/40 backdrop-blur"
        style={{ background: "rgba(18,20,23,.82)", borderColor: scene === 3 ? `rgba(198,244,50,${0.5 * visible})` : LINE }}
      >
        <div style={sceneStyle} className="h-full">
          {scene === 0 && <SceneExpense t={local} />}
          {scene === 1 && <SceneCutoffs t={local} />}
          {scene === 2 && <SceneStatement t={local} />}
          {scene === 3 && <SceneDone t={local} />}
        </div>
      </div>
    </div>
  );
}

// ---------- Escena 1: registrar un gasto ----------
function SceneExpense({ t }: { t: number }) {
  const word = "Refrigerador";
  const typed = word.slice(0, Math.floor(seg(t, 300, 1100) * word.length));
  const caretOn = t < 1300 && Math.floor(t / 400) % 2 === 0;
  const amount = 12000 * outCubic(seg(t, 1150, 1750));
  const chips = ["Contado", "3 MSI", "6 MSI", "12 MSI"];
  const clicked = t >= 2350;
  // Cursor: entra desde abajo a la derecha y "pica" 12 MSI
  const cur = outCubic(seg(t, 1800, 2300));
  const press = t >= 2300 && t < 2450 ? 0.85 : 1;
  const ring = seg(t, 2330, 2750);

  return (
    <div className="relative flex h-full flex-col gap-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-display text-base font-bold">Nuevo gasto</span>
        <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: SLATE, color: MUTE }}>
          Tarjeta de Perla
        </span>
      </div>
      <div className="grid grid-cols-[1fr_7.5rem] gap-2">
        <FakeInput label="¿Qué fue?">
          {typed}
          <span style={{ opacity: caretOn ? 1 : 0, color: LIME }}>|</span>
        </FakeInput>
        <FakeInput label="Monto">
          <span className="tabular font-display font-bold">{money(amount)}</span>
        </FakeInput>
      </div>
      <div>
        <p className="text-[11px]" style={{ color: MUTE }}>
          Forma de pago
        </p>
        <div className="relative mt-1.5 flex gap-1.5">
          {chips.map((c, i) => {
            const active = i === 3 ? clicked : i === 0 && !clicked;
            return (
              <span
                key={c}
                className="relative rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  background: active ? LIME : SLATE,
                  color: active ? INK : "rgba(242,242,238,.8)",
                  transform: i === 3 && clicked ? `scale(${lerp(1.15, 1, seg(t, 2350, 2600))})` : undefined,
                }}
              >
                {c}
                {i === 3 && ring > 0 && ring < 1 && (
                  <span className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 ${ring * 10}px rgba(198,244,50,${0.5 * (1 - ring)})` }} />
                )}
              </span>
            );
          })}
          {/* cursor */}
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            className="absolute"
            style={{
              left: lerp(280, 222, cur),
              top: lerp(70, 12, cur),
              opacity: t > 1750 && t < 3300 ? 1 : 0,
              transform: `scale(${press})`,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,.6))",
            }}
          >
            <path d="M4 3l15 7-6.5 2L10 19z" fill="#fff" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <div>
        <p className="text-[11px]" style={{ color: MUTE }}>
          Entre
        </p>
        <div className="mt-1.5 flex gap-2">
          {[
            { n: "Mario", c: "#F9A8D4", at: 2600 },
            { n: "Beto", c: "#C4B5FD", at: 2750 },
          ].map((p) => (
            <span key={p.n} className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-xs" style={{ background: SLATE, ...enter(t, p.at, 400, 8) }}>
              <Avatar name={p.n} color={p.c} size={20} />
              {p.n}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-auto rounded-2xl p-3" style={{ background: INK, ...enter(t, 3050, 500, 24) }}>
        <p className="text-xs" style={{ color: MUTE }}>
          Entra al corte del <b className="text-paper">5 de diciembre</b>
        </p>
        <p className="mt-0.5 font-display font-bold">
          12 mensualidades de <span style={{ color: LIME }}>$1,000</span>
        </p>
        <p className="text-xs" style={{ color: MUTE }}>
          $500 al mes para Mario y $500 para Beto
        </p>
      </div>
    </div>
  );
}

// ---------- Escena 2: los cargos caen en su corte ----------
const COLS = [
  { cutoff: "5 nov", due: "paga 25 nov" },
  { cutoff: "5 dic", due: "paga 25 dic" },
  { cutoff: "5 ene", due: "paga 25 ene" },
];
const ITEMS = [
  { label: "Luz", date: "1 nov", amount: 900, col: 0, at: 250, late: false },
  { label: "Súper", date: "3 nov", amount: 2340, col: 0, at: 650, late: false },
  { label: "Internet", date: "6 nov", amount: 599, col: 1, at: 1150, late: true },
  { label: "Refri 1/12", date: "MSI", amount: 1000, col: 1, at: 2350, late: false },
  { label: "Refri 2/12", date: "MSI", amount: 1000, col: 2, at: 2650, late: false },
];

function SceneCutoffs({ t }: { t: number }) {
  const tip = seg(t, 1500, 1750) * (1 - seg(t, 2200, 2400));
  const msi = enter(t, 2950, 450, 10);
  return (
    <div className="relative grid h-full grid-cols-3 gap-2 text-xs">
      {COLS.map((c, ci) => {
        const items = ITEMS.filter((it) => it.col === ci);
        const total = items.reduce((a, it) => a + it.amount * outCubic(seg(t, it.at + 300, it.at + 700)), 0);
        return (
          <div key={ci} className="flex flex-col rounded-2xl border p-2" style={{ borderColor: LINE, background: "rgba(42,46,53,.35)", ...enter(t, ci * 80, 400, 10) }}>
            <p className="font-display text-sm font-bold">Corte {c.cutoff}</p>
            <p style={{ color: MUTE }}>{c.due}</p>
            <div className="mt-2 flex flex-1 flex-col gap-1.5">
              {items.map((it) => {
                const p = seg(t, it.at, it.at + 550);
                const fly = outBack(p);
                return (
                  <div
                    key={it.label}
                    className="rounded-lg px-2 py-1.5"
                    style={{
                      background: SLATE,
                      opacity: clamp(p * 3),
                      transform: `translateY(${(1 - fly) * -70}px) rotate(${(1 - fly) * (ci === 1 ? 8 : -6)}deg)`,
                      boxShadow: it.late && tip > 0 ? `0 0 0 1.5px rgba(255,92,92,${tip})` : undefined,
                    }}
                  >
                    <p className="truncate font-medium">{it.label}</p>
                    <p className="flex justify-between" style={{ color: MUTE }}>
                      <span>{it.date}</span>
                      <span className="tabular text-paper">{money(it.amount)}</span>
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 flex justify-between border-t pt-1.5 font-semibold" style={{ borderColor: LINE }}>
              <span style={{ color: MUTE }}>Total</span>
              <span className="tabular">{money(total)}</span>
            </p>
          </div>
        );
      })}
      {/* Explicaciones */}
      <div
        className="pointer-events-none absolute left-1/2 top-[54%] w-[230px] rounded-xl px-3 py-2 text-center text-xs shadow-xl"
        style={{ background: CORAL, color: INK, opacity: tip, transform: `translate(-50%, ${(1 - tip) * 8}px)` }}
      >
        <b>Comprado el 6, un día después del corte:</b> se paga hasta diciembre
      </div>
      <div
        className="pointer-events-none absolute bottom-12 left-1/2 w-[240px] rounded-xl px-3 py-2 text-center text-xs shadow-xl"
        style={{ background: LIME, color: INK, opacity: msi.opacity, transform: `translateX(-50%) ${msi.transform}` }}
      >
        <b>Meses sin intereses:</b> una mensualidad en cada corte
      </div>
    </div>
  );
}

// ---------- Escena 3: estado de cuenta y depósitos ----------
const PEOPLE = [
  { name: "Mario", detail: "Audífonos + luz", amount: 1100, color: "#F9A8D4", paidAt: -1 },
  { name: "Beto", detail: "Celular 2/6 + luz", amount: 1300, color: "#C4B5FD", paidAt: 1300 },
  { name: "Carlos", detail: "Regalo para mamá", amount: 1500, color: "#FDBA74", paidAt: 2600 },
];
const SUM = PEOPLE.reduce((a, p) => a + p.amount, 0);

function SceneStatement({ t }: { t: number }) {
  const paidAmount = PEOPLE.reduce((a, p) => a + p.amount * (p.paidAt < 0 ? 1 : outCubic(seg(t, p.paidAt + 200, p.paidAt + 800))), 0);
  const pending = SUM - paidAmount;
  const done = t > 3500;
  const toastP = t < 2300 ? seg(t, 900, 1200) * (1 - seg(t, 2050, 2300)) : seg(t, 2300, 2600) * (1 - seg(t, 3300, 3550));
  const toastWho = t < 2300 ? PEOPLE[1] : PEOPLE[2];

  return (
    <div className="relative flex h-full flex-col text-sm">
      <div
        className="absolute -right-1 -top-1 z-10 flex items-center gap-2.5 rounded-2xl border px-3 py-2 shadow-2xl shadow-black/60"
        style={{ background: SLATE, borderColor: LINE, opacity: toastP, transform: `translateY(${(1 - outBack(toastP)) * -14}px)` }}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: LIME, color: INK }}>
          <Icon name="arrowUp" className="h-4 w-4" strokeWidth={2.4} />
        </span>
        <span className="text-xs leading-tight">
          <b>
            {toastWho.name} depositó {money(toastWho.amount)}
          </b>
          <span className="block" style={{ color: MUTE }}>
            a Perla · ahora
          </span>
        </span>
      </div>

      <div className="flex items-center gap-3" style={enter(t, 0, 400, 8)}>
        <CorteIcon className="h-8 w-8" />
        <div>
          <p className="font-semibold">Tarjeta de Perla · corte del 5</p>
          <p className="text-xs" style={{ color: MUTE }}>
            Pagar antes del 25 sin intereses
          </p>
        </div>
      </div>
      <ul className="mt-2">
        {PEOPLE.map((p, i) => {
          const paid = p.paidAt < 0 || t >= p.paidAt + 200;
          const pop = p.paidAt < 0 ? 1 : outBack(seg(t, p.paidAt + 200, p.paidAt + 550));
          return (
            <li key={p.name} className="flex items-center gap-3 border-b py-2 last:border-0" style={{ borderColor: LINE, ...enter(t, 150 + i * 150, 450) }}>
              <Avatar name={p.name} color={p.color} size={30} />
              <span className="flex-1">
                <span className="font-medium">{p.name}</span>
                <span className="block text-xs" style={{ color: MUTE }}>
                  {p.detail}
                </span>
              </span>
              <span className="text-right">
                <span className="tabular block font-display font-bold">{money(p.amount)}</span>
                <span className="inline-block text-xs font-medium" style={{ color: paid ? LIME : CORAL, transform: `scale(${paid ? lerp(0.6, 1, pop) : 1})` }}>
                  {paid ? (
                    <span className="inline-flex items-center gap-1">
                      <Icon name="check" className="h-3 w-3" strokeWidth={3} />
                      Pagado
                    </span>
                  ) : (
                    "Pendiente"
                  )}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto">
        <div className="h-2 overflow-hidden rounded-full" style={{ background: SLATE }}>
          <div className="h-full rounded-full" style={{ background: LIME, width: `${(paidAmount / SUM) * 100}%` }} />
        </div>
        <div className="mt-2.5 flex h-10 items-center justify-between rounded-xl px-3" style={{ background: done ? "rgba(198,244,50,.14)" : "rgba(255,92,92,.10)" }}>
          {done ? (
            <span className="inline-block font-semibold" style={{ color: LIME, transform: `scale(${outBack(seg(t, 3500, 3850))})` }}>
              ¡Corte cubierto! Sin intereses
            </span>
          ) : (
            <>
              <span style={{ color: CORAL }}>Falta para no pagar intereses</span>
              <span className="tabular font-display font-bold" style={{ color: CORAL }}>
                {money(pending)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Escena 4: todos a mano ----------
const CONFETTI = Array.from({ length: 22 }, (_, i) => {
  const r = (n: number) => (Math.sin(i * 999 + n * 77) + 1) / 2;
  return {
    x: r(1) * 100,
    delay: r(2) * 600,
    size: 5 + r(3) * 6,
    color: [LIME, CORAL, "#C4B5FD", "#F2F2EE", "#FDBA74"][i % 5],
    drift: (r(4) - 0.5) * 60,
    spin: r(5) * 720,
  };
});

function SceneDone({ t }: { t: number }) {
  const check = outBack(seg(t, 150, 650));
  const ring = seg(t, 300, 1100);
  return (
    <div className="relative flex h-full flex-col items-center justify-center text-center">
      {CONFETTI.map((c, i) => {
        const p = seg(t, 400 + c.delay, 2600 + c.delay);
        return (
          <span
            key={i}
            className="absolute top-0 rounded-[2px]"
            style={{
              left: `${c.x}%`,
              width: c.size,
              height: c.size * 0.6,
              background: c.color,
              opacity: p > 0 && p < 1 ? 1 - p * 0.6 : 0,
              transform: `translate(${c.drift * p}px, ${p * 330}px) rotate(${c.spin * p}deg)`,
            }}
          />
        );
      })}
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 ${ring * 34}px rgba(198,244,50,${0.35 * (1 - ring)})` }} />
        <span className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: LIME, transform: `scale(${check})` }}>
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke={INK} strokeWidth="3">
            <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset={24 * (1 - seg(t, 450, 850))} />
          </svg>
        </span>
      </div>
      <p className="mt-5 font-display text-2xl font-bold" style={enter(t, 700, 500)}>
        Todos a mano
      </p>
      <p className="mt-1 max-w-[260px] text-sm" style={{ color: MUTE, ...enter(t, 900, 500) }}>
        Sin intereses y sin mensajes de “oye, ¿cuánto te debo?”
      </p>
      <div className="mt-4 flex -space-x-2">
        {[
          { n: "Perla", c: "#FF5C5C" },
          { n: "Mario", c: "#F9A8D4" },
          { n: "Beto", c: "#C4B5FD" },
          { n: "Carlos", c: "#FDBA74" },
        ].map((p, i) => (
          <span key={p.n} className="rounded-full" style={{ boxShadow: `0 0 0 3px ${INK}`, ...enter(t, 1200 + i * 120, 400, 12) }}>
            <Avatar name={p.n} color={p.c} size={34} />
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------- piezas ----------
function Avatar({ name, color, size }: { name: string; color: string; size: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold"
      style={{ width: size, height: size, background: color, color: INK, fontSize: size * 0.42 }}
    >
      {name[0]}
    </span>
  );
}

function FakeInput({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px]" style={{ color: MUTE }}>
        {label}
      </p>
      <div className="mt-1 flex h-10 items-center rounded-xl border px-3" style={{ borderColor: LINE, background: INK }}>
        {children}
      </div>
    </div>
  );
}
