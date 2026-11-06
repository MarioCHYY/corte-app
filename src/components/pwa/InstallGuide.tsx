"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CorteIcon } from "@/components/brand/Logo";
import { Icon } from "@/components/icons";

/**
 * Tutorial para instalar corte en el celular desde el navegador,
 * con ilustraciones de cada paso para iPhone (Safari) y Android (Chrome).
 * Si el navegador permite instalar directo, muestra el botón "Instalar ahora".
 */

type Platform = "ios" | "android";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const noop = () => () => {};
const detect = (): Platform => (/android/i.test(navigator.userAgent) ? "android" : "ios");

export function InstallGuide({ appUrl: appUrlProp }: { appUrl?: string }) {
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => "");
  const appUrl = appUrlProp || origin || "/";
  const appLabel = appUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") || "corte";
  const detected = useSyncExternalStore(noop, detect, () => "ios" as Platform);
  const [chosen, setChosen] = useState<Platform | null>(null);
  const platform = chosen ?? detected;
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const steps = platform === "ios" ? IOS_STEPS : ANDROID_STEPS;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-full bg-slate-2 p-1" role="tablist" aria-label="Tipo de celular">
          {(
            [
              ["ios", "iPhone"],
              ["android", "Android"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={platform === id}
              onClick={() => setChosen(id)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${platform === id ? "bg-lime text-ink" : "text-paper/70 hover:text-paper"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {promptEvent && !installed && (
          <button
            onClick={async () => {
              await promptEvent.prompt();
              const choice = await promptEvent.userChoice;
              if (choice.outcome === "accepted") setInstalled(true);
              setPromptEvent(null);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2 text-sm font-semibold text-ink"
          >
            <Icon name="download" className="h-4 w-4" size={16} />
            Instalar ahora
          </button>
        )}
        {installed && <span className="text-sm font-medium text-lime">Listo, ya está en tu pantalla de inicio.</span>}
      </div>

      <ol className="mt-8 grid snap-x snap-mandatory auto-cols-[78%] grid-flow-col gap-4 overflow-x-auto pb-4 sm:auto-cols-[44%] lg:grid-flow-row lg:grid-cols-5 lg:overflow-visible">
        {steps.map((s, i) => (
          <li key={`${platform}-${i}`} className="cell-in snap-start" style={{ "--i": i } as React.CSSProperties}>
            <div className="flex h-[300px] items-end justify-center overflow-hidden rounded-3xl border border-line bg-slate-2 px-4 pt-6">
              <MiniPhone>{s.art(appLabel)}</MiniPhone>
            </div>
            <p className="mt-4 flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime font-display text-sm font-bold text-ink">{i + 1}</span>
              <span>
                <span className="block font-semibold">{s.title}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-paper/65">{s.body(appLabel)}</span>
              </span>
            </p>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-sm text-paper/60">
        {platform === "ios"
          ? "Funciona en Safari. En las versiones más nuevas de iOS el botón Compartir está dentro del menú ⋯ de la barra de abajo."
          : "En algunos celulares la opción dice “Instalar app” y en otros “Agregar a la pantalla principal”. Las dos hacen lo mismo."}{" "}
        La app se abre en{" "}
        <a href={appUrl} className="text-lime underline-offset-4 hover:underline">
          {appLabel}
        </a>
        .
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pasos
// ---------------------------------------------------------------------------

interface Step {
  title: string;
  body: (app: string) => string;
  art: (app: string) => React.ReactNode;
}

const IOS_STEPS: Step[] = [
  {
    title: "Abre corte en Safari",
    body: (app) => `Entra a ${app} desde Safari e inicia sesión.`,
    art: (app) => (
      <Screen>
        <AppPreview />
        <SafariBar url={app} />
      </Screen>
    ),
  },
  {
    title: "Toca Compartir",
    body: () => "Es el cuadrito con una flecha hacia arriba, en la barra de abajo.",
    art: (app) => (
      <Screen>
        <AppPreview />
        <SafariBar url={app} highlight="share" />
      </Screen>
    ),
  },
  {
    title: "Agregar a pantalla de inicio",
    body: () => "Baja un poco en el menú y elige esa opción.",
    art: () => (
      <Screen dim>
        <Sheet
          rows={[
            { icon: "file", label: "Copiar" },
            { icon: "lock", label: "Agregar a favoritos" },
            { icon: "plus", label: "Agregar a pantalla de inicio", hl: true },
          ]}
        />
      </Screen>
    ),
  },
  {
    title: "Toca Agregar",
    body: () => "Arriba a la derecha. Puedes dejarle el nombre corte.",
    art: () => (
      <Screen>
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[9px]">
          <span className="text-[#0a84ff]">Cancelar</span>
          <span className="font-semibold">Agregar a inicio</span>
          <Pulse>
            <span className="font-semibold text-[#0a84ff]">Agregar</span>
          </Pulse>
        </div>
        <div className="flex items-center gap-2 p-3">
          <AppIcon size={30} />
          <div className="flex-1 rounded bg-white/10 px-2 py-1.5 text-[9px]">corte</div>
        </div>
      </Screen>
    ),
  },
  {
    title: "¡Listo!",
    body: () => "corte queda en tu pantalla de inicio y se abre como cualquier app, sin barra del navegador.",
    art: () => <HomeScreen />,
  },
];

const ANDROID_STEPS: Step[] = [
  {
    title: "Abre corte en Chrome",
    body: (app) => `Entra a ${app} desde Chrome e inicia sesión.`,
    art: (app) => (
      <Screen>
        <ChromeBar url={app} />
        <AppPreview />
      </Screen>
    ),
  },
  {
    title: "Toca el menú ⋮",
    body: () => "Son los tres puntos arriba a la derecha.",
    art: (app) => (
      <Screen>
        <ChromeBar url={app} highlight />
        <AppPreview />
      </Screen>
    ),
  },
  {
    title: "Instalar app",
    body: () => "Elige “Instalar app” o “Agregar a la pantalla principal”.",
    art: (app) => (
      <Screen>
        <ChromeBar url={app} />
        <div className="relative">
          <AppPreview />
          <div className="absolute right-1 top-0 w-[78%] rounded-lg bg-[#2b2d31] py-1 text-[9px] shadow-xl">
            {["Nueva pestaña", "Historial", "Descargas", "Compartir…"].map((r) => (
              <p key={r} className="px-3 py-1.5 text-white/80">
                {r}
              </p>
            ))}
            <Pulse block>
              <p className="flex items-center gap-1.5 bg-lime/20 px-3 py-1.5 font-semibold text-white">
                <Icon name="download" className="h-3 w-3" size={12} /> Instalar app
              </p>
            </Pulse>
          </div>
        </div>
      </Screen>
    ),
  },
  {
    title: "Confirma Instalar",
    body: () => "Android te pregunta una vez más. Toca Instalar.",
    art: () => (
      <Screen dim>
        <div className="mx-3 mt-16 rounded-xl bg-[#2b2d31] p-3 text-[9px] shadow-2xl">
          <div className="flex items-center gap-2">
            <AppIcon size={26} />
            <div>
              <p className="font-semibold text-white">¿Instalar app?</p>
              <p className="text-white/60">corte</p>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-3 font-semibold">
            <span className="text-[#8ab4f8]">Cancelar</span>
            <Pulse>
              <span className="text-[#8ab4f8]">Instalar</span>
            </Pulse>
          </div>
        </div>
      </Screen>
    ),
  },
  {
    title: "¡Listo!",
    body: () => "corte aparece con tus apps y se abre a pantalla completa.",
    art: () => <HomeScreen />,
  },
];

// ---------------------------------------------------------------------------
// Ilustraciones
// ---------------------------------------------------------------------------

function MiniPhone({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[280px] w-[150px] rounded-t-[26px] bg-black p-[7px] pb-0 shadow-2xl shadow-black/60 ring-1 ring-line" aria-hidden>
      <div className="relative h-full overflow-hidden rounded-t-[20px] bg-ink text-paper">{children}</div>
    </div>
  );
}

function Screen({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <div className="relative flex h-full flex-col">
      <div className="flex justify-between px-3 pb-1 pt-2 text-[8px] font-semibold">
        <span>9:41</span>
        <span className="mx-auto h-3 w-12 rounded-full bg-black" />
        <span>100%</span>
      </div>
      {dim && <div className="absolute inset-0 z-10 bg-black/50" />}
      <div className={`relative flex flex-1 flex-col ${dim ? "z-20" : ""}`}>{children}</div>
    </div>
  );
}

function AppPreview() {
  return (
    <div className="flex-1 space-y-1.5 px-2.5 pt-1">
      <div className="flex items-center gap-1.5">
        <CorteIcon className="h-3.5 w-3.5" />
        <span className="text-[8px] font-bold">Casa</span>
      </div>
      <div className="rounded-lg border border-line bg-slate-2 p-2">
        <p className="text-[7px] text-mute">Le debes a Perla</p>
        <p className="font-display text-[13px] font-bold">$1,300.00</p>
        <div className="mt-1 h-1 rounded-full bg-slate">
          <div className="h-full w-2/3 rounded-full bg-lime" />
        </div>
      </div>
      <div className="space-y-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 rounded bg-slate-2" />
        ))}
      </div>
    </div>
  );
}

function SafariBar({ url, highlight }: { url: string; highlight?: "share" }) {
  return (
    <div className="mt-auto bg-[#1c1c1e] px-2 pb-3 pt-2">
      <div className="truncate rounded-lg bg-white/10 px-2 py-1 text-center text-[8px] text-white/80">{url.replace(/^https?:\/\//, "")}</div>
      <div className="mt-2 flex items-center justify-between px-1 text-[#0a84ff]">
        <Icon name="chevronLeft" className="h-3 w-3" size={12} />
        <Icon name="chevronRight" className="h-3 w-3 opacity-40" size={12} />
        {highlight === "share" ? (
          <Pulse>
            <ShareIcon />
          </Pulse>
        ) : (
          <ShareIcon />
        )}
        <Icon name="file" className="h-3 w-3" size={12} />
        <span className="text-[10px] leading-none">⋯</span>
      </div>
    </div>
  );
}

function ChromeBar({ url, highlight }: { url: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#202124] px-2 py-1.5">
      <div className="flex-1 truncate rounded-full bg-white/10 px-2 py-1 text-[8px] text-white/80">{url.replace(/^https?:\/\//, "")}</div>
      {highlight ? (
        <Pulse>
          <span className="block px-1 text-[11px] font-bold leading-none text-white">⋮</span>
        </Pulse>
      ) : (
        <span className="px-1 text-[11px] font-bold leading-none text-white/80">⋮</span>
      )}
    </div>
  );
}

function Sheet({ rows }: { rows: { icon: "file" | "lock" | "plus"; label: string; hl?: boolean }[] }) {
  return (
    <div className="mt-auto rounded-t-2xl bg-[#1c1c1e] px-2 pb-4 pt-2">
      <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-white/20" />
      <div className="mb-2 flex items-center gap-2 rounded-lg bg-white/5 p-1.5">
        <AppIcon size={20} />
        <span className="text-[8px] text-white/80">corte</span>
      </div>
      <div className="overflow-hidden rounded-lg bg-white/5">
        {rows.map((r) =>
          r.hl ? (
            <Pulse key={r.label} block>
              <p className="flex items-center justify-between bg-lime/15 px-2 py-1.5 text-[8px] font-semibold text-white">
                {r.label}
                <span className="flex h-3 w-3 items-center justify-center rounded-[3px] border border-white text-[8px] leading-none">+</span>
              </p>
            </Pulse>
          ) : (
            <p key={r.label} className="flex items-center justify-between border-b border-white/5 px-2 py-1.5 text-[8px] text-white/80">
              {r.label}
              <Icon name={r.icon === "plus" ? "file" : r.icon} className="h-2.5 w-2.5" size={10} />
            </p>
          ),
        )}
      </div>
    </div>
  );
}

function HomeScreen() {
  const apps = ["#5ac8fa", "#34c759", "#ff9500", "#ff2d55", "#af52de", "#ffcc00", "#5856d6", "corte", "#8e8e93", "#30b0c7", "#a2845e"];
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#2a2e35] to-[#121417] px-3 pt-8">
      <div className="grid grid-cols-4 gap-x-2 gap-y-3">
        {apps.map((a, i) =>
          a === "corte" ? (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <Pulse>
                <AppIcon size={26} />
              </Pulse>
              <span className="text-[6px] font-medium text-white">corte</span>
            </div>
          ) : (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="h-[26px] w-[26px] rounded-[7px]" style={{ background: a, opacity: 0.55 }} />
              <span className="h-[3px] w-4 rounded bg-white/20" />
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function AppIcon({ size }: { size: number }) {
  return (
    <span className="flex items-center justify-center bg-ink ring-1 ring-white/10" style={{ width: size, height: size, borderRadius: size * 0.23 }}>
      <CorteIcon className="h-[70%] w-[70%]" />
    </span>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12M7.5 7.5L12 3l4.5 4.5" />
      <path d="M6 11H5v10h14V11h-1" />
    </svg>
  );
}

/** Anillo que late para señalar dónde tocar. */
function Pulse({ children, block }: { children: React.ReactNode; block?: boolean }) {
  return (
    <span className={`relative ${block ? "block" : "inline-flex"}`}>
      {children}
      <span className="install-pulse pointer-events-none absolute -inset-1.5 rounded-lg border-2 border-lime" />
    </span>
  );
}
