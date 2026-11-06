import type { Metadata } from "next";
import Link from "next/link";
import { CorteIcon, CorteLogo } from "@/components/brand/Logo";
import { Icon, type IconName } from "@/components/icons";
import { CutoffRuler } from "@/components/landing/CutoffRuler";
import { MsiDemo } from "@/components/landing/MsiDemo";
import { SettleDiagram } from "@/components/landing/SettleDiagram";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { absolute: "corte: la tarjeta de todos en casa, sin enredos" },
  description:
    "Reparte los gastos de la casa y controla la tarjeta que usan todos: en qué corte cae cada compra, los meses sin intereses y cuánto le toca depositar a cada quien antes de la fecha límite.",
};

// ---------------------------------------------------------------------------
// Contenido
// ---------------------------------------------------------------------------

const CHAT = [
  { who: "Perla", me: true, text: "Ya llegó el estado de cuenta. Beto 1,300, Carlos 1,500 y Mario 1,100" },
  { who: "Beto", text: "¿El celular ya va en la mensualidad 2 o en la 3?" },
  { who: "Carlos", text: "El perfume lo compré el 6, ¿no entraba hasta el otro mes?" },
  { who: "Mario", text: "¿La luz se dividió entre 3 o entre 4?" },
  { who: "Perla", me: true, text: "Ya no sé. Nada más deposítenme antes del 25 porfa, que si no me cobran intereses" },
];

const STATEMENT = [
  { name: "Mario", detail: "Audífonos y su parte de la luz", amount: "$1,100.00", paid: true, color: "#F9A8D4" },
  { name: "Beto", detail: "Celular, mensualidad 2 de 6, y luz", amount: "$1,300.00", paid: false, color: "#C4B5FD" },
  { name: "Carlos", detail: "Su parte de la luz (el perfume va en diciembre)", amount: "$225.00", paid: false, color: "#FDBA74" },
];

const STEPS = [
  { title: "Crea el grupo de tu casa", body: "Agrega a todos por nombre, aunque no tengan cuenta. Luego les mandas un link para que entren." },
  { title: "Da de alta la tarjeta", body: "Quién es el titular, qué día corta y cuántos días da el banco para pagar. Viene en el estado de cuenta." },
  { title: "Registra lo que se compra", body: "Si es de todos, de una persona o un regalo, y si fue de contado o a meses. Toma unos segundos." },
  { title: "Cada quien ve su parte", body: "Cuánto depositarle al titular, antes de qué día y qué viene en los próximos meses." },
];

const MORE: { icon: IconName; title: string; body: string }[] = [
  { icon: "users", title: "Personas sin cuenta", body: "La abuela también entra en las cuentas aunque nunca abra la app." },
  { icon: "card", title: "Varias tarjetas", body: "Cada una con su titular, su día de corte y sus días para pagar." },
  { icon: "gift", title: "Regalos", body: "Se le cobra a quien regala, aunque la compra salga en otra tarjeta." },
  { icon: "file", title: "Compara con el banco", body: "Escribe el total del estado de cuenta y corte te dice si falta registrar algo." },
  { icon: "cash", title: "Gastos en efectivo", body: "La pizza que pagó Mario también entra en los saldos del grupo." },
  { icon: "download", title: "Tus datos son tuyos", body: "Descárgalos cuando quieras o elimina tu cuenta desde la app." },
];

type Mark = "yes" | "no" | "manual";
const COMPARE: { row: string; chat: Mark; sheet: Mark; apps: Mark; corte: Mark }[] = [
  { row: "Divide gastos entre varias personas", chat: "manual", sheet: "manual", apps: "yes", corte: "yes" },
  { row: "Sabe en qué corte cae cada compra", chat: "no", sheet: "manual", apps: "no", corte: "yes" },
  { row: "Arma el calendario de meses sin intereses", chat: "no", sheet: "manual", apps: "no", corte: "yes" },
  { row: "Dice cuánto depositarle al titular en cada corte", chat: "manual", sheet: "manual", apps: "no", corte: "yes" },
  { row: "Cada quien lo ve desde su celular", chat: "yes", sheet: "manual", apps: "yes", corte: "yes" },
];

const PRIVACY: { icon: IconName; title: string; body: string }[] = [
  { icon: "card", title: "Nunca pedimos tu tarjeta", body: "Ni el número, ni el CVV, ni tu NIP. Solo, si quieres, los últimos 4 dígitos." },
  { icon: "bank", title: "No se conecta a tu banco", body: "Los montos los registran ustedes. corte no mueve dinero." },
  { icon: "ban", title: "Sin anuncios", body: "No vendemos tus datos ni los usamos para publicidad." },
  { icon: "lock", title: "Tu grupo es privado", body: "Solo lo ven las personas que invitas." },
];

const FAQ = [
  {
    q: "¿Cuánto cuesta?",
    a: "Nada. corte es gratis.",
  },
  {
    q: "¿Necesito darle a corte los datos de mi tarjeta?",
    a: "No. Solo el nombre de la tarjeta, quién es el titular, el día de corte y los días para pagar. Los últimos 4 dígitos son opcionales y solo sirven para reconocerla.",
  },
  {
    q: "¿Y si en mi casa no usamos una tarjeta compartida?",
    a: "corte también funciona como una app normal de gastos compartidos: registras quién pagó qué y te dice quién le debe a quién.",
  },
  {
    q: "¿Todos tienen que crear cuenta?",
    a: "No. Puedes agregar a las personas por nombre y llevar sus cuentas tú. Si después se unen, eligen su nombre y ven todo lo que ya tenían.",
  },
  {
    q: "¿Qué pasa con las compras que se hacen justo el día de corte?",
    a: "Entran en ese mismo estado de cuenta. Las del día siguiente ya se van al próximo. corte lo calcula solo con la fecha de cada compra.",
  },
  {
    q: "¿Puedo usarlo desde el celular?",
    a: "Sí. corte funciona en el navegador de cualquier celular o computadora, sin instalar nada.",
  },
];

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default async function Home({ searchParams }: PageProps<"/">) {
  const user = await getCurrentUser();
  const { cuenta } = await searchParams;
  const primaryHref = user ? "/grupos" : "/registro";
  const primaryLabel = user ? "Ir a mis grupos" : "Crear cuenta gratis";

  return (
    <main className="flex-1 overflow-x-clip">
      {cuenta === "eliminada" && (
        <p className="bg-lime/10 px-4 py-3 text-center text-sm text-lime">Tu cuenta se eliminó. Gracias por haber usado corte.</p>
      )}

      {/* ---------- Navegación ---------- */}
      <header className="sticky top-0 z-40 border-b border-transparent bg-ink/80 backdrop-blur supports-[backdrop-filter]:bg-ink/70">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4 sm:px-6">
          <Link href="/" aria-label="corte, inicio">
            <CorteLogo className="h-8 w-auto" />
          </Link>
          <nav className="hidden flex-1 gap-6 text-sm text-paper/70 md:flex">
            <a href="#como-funciona" className="hover:text-paper">
              Cómo funciona
            </a>
            <a href="#funciones" className="hover:text-paper">
              Funciones
            </a>
            <a href="#privacidad" className="hover:text-paper">
              Privacidad
            </a>
            <a href="#preguntas" className="hover:text-paper">
              Preguntas
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {!user && (
              <Link href="/entrar" className="rounded-xl px-3 py-2 text-sm font-medium text-paper/80 hover:text-paper">
                Entrar
              </Link>
            )}
            <Link href={primaryHref} className="rounded-xl bg-lime px-4 py-2 text-sm font-semibold text-ink transition hover:bg-lime-dim">
              {user ? "Mis grupos" : "Crear cuenta"}
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- Portada ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pt-20">
        <div className="grid items-end gap-8 lg:grid-cols-[1.25fr_1fr]">
          <h1 className="font-display text-[44px] font-bold leading-[0.98] tracking-[-0.035em] sm:text-7xl lg:text-[84px]">
            La tarjeta es de una. Las compras son de todos.
          </h1>
          <div className="lg:pb-3">
            <p className="text-lg leading-relaxed text-paper/75">
              corte reparte los gastos de la casa, sabe en qué estado de cuenta cae cada compra y le dice a cada quien cuánto depositar
              antes de la fecha límite. Sin hojas de cálculo y sin intereses.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={primaryHref} className="rounded-xl bg-lime px-5 py-3 font-semibold text-ink transition hover:bg-lime-dim">
                {primaryLabel}
              </Link>
              <a href="#como-funciona" className="rounded-xl border border-line px-5 py-3 font-medium text-paper transition hover:border-mute/60">
                Ver cómo funciona
              </a>
            </div>
          </div>
        </div>
        <div className="mt-14">
          <CutoffRuler />
        </div>
      </section>

      {/* ---------- El problema ---------- */}
      <section className="bg-paper text-ink">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <h2 className="max-w-3xl font-display text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-6xl">
            Así se cobra hoy la tarjeta en muchas casas.
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-ink/70">
            Una persona recibe el estado de cuenta, hace las cuentas a mano y persigue a todos por el chat. Cada mes.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {/* Chat */}
            <figure className="rounded-[28px] bg-[#e4e4de] p-5 sm:p-6">
              <figcaption className="mb-4 flex items-center justify-between text-sm">
                <span className="font-semibold">Casa</span>
                <span className="text-ink/50">4 personas</span>
              </figcaption>
              <ul className="space-y-2.5">
                {CHAT.map((m, i) => (
                  <li key={i} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-snug ${m.me ? "rounded-br-md bg-ink text-paper" : "rounded-bl-md bg-white text-ink"}`}>
                      {!m.me && <p className="text-xs font-semibold text-ink/50">{m.who}</p>}
                      {m.text}
                    </div>
                  </li>
                ))}
              </ul>
            </figure>

            {/* Con corte */}
            <figure className="rounded-[28px] bg-ink p-5 text-paper sm:p-6">
              <figcaption className="flex items-center gap-3">
                <CorteIcon className="h-9 w-9" />
                <span>
                  <span className="block font-semibold">Tarjeta de Perla, corte del 5 de noviembre</span>
                  <span className="block text-sm text-mute">Pagar antes del 25 de noviembre sin intereses</span>
                </span>
              </figcaption>
              <ul className="mt-4 divide-y divide-line">
                {STATEMENT.map((p) => (
                  <li key={p.name} className="flex items-center gap-3 py-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display font-bold text-ink" style={{ background: p.color }}>
                      {p.name[0]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{p.name}</span>
                      <span className="block text-sm text-mute">{p.detail}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-display font-bold tabular">{p.amount}</span>
                      <span className={`text-xs font-medium ${p.paid ? "text-lime" : "text-coral"}`}>{p.paid ? "Pagado" : "Pendiente"}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded-xl bg-coral/10 px-4 py-3 text-sm text-coral">Faltan $1,525.00 para cubrir el total sin intereses.</p>
            </figure>
          </div>
        </div>
      </section>

      {/* ---------- Cómo funciona ---------- */}
      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
        <h2 className="max-w-2xl font-display text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-5xl">Se configura una vez. Después solo registras.</h2>
        <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
          <span className="absolute left-5 top-5 hidden h-px w-[calc(100%-2.5rem)] bg-line md:block" aria-hidden />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-lime font-display text-lg font-bold text-ink">{i + 1}</span>
              <h3 className="mt-5 font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-paper/70">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Funciones ---------- */}
      <section id="funciones" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto max-w-6xl space-y-24 px-4 py-20 sm:px-6 sm:space-y-32 sm:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-5xl">Meses sin intereses que no se olvidan.</h2>
              <p className="mt-4 text-lg leading-relaxed text-paper/70">
                Registras la compra una vez. corte pone cada mensualidad en su corte, la reparte entre quienes la compraron y te avisa cuánto falta
                para terminar.
              </p>
            </div>
            <MsiDemo />
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div className="order-2 lg:order-1">
              <SettleDiagram />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-5xl">Quedar a mano con menos transferencias.</h2>
              <p className="mt-4 text-lg leading-relaxed text-paper/70">
                Gastos en efectivo, pagos con tarjeta, depósitos y regalos: corte junta todo y te dice el número mínimo de pagos para que el grupo
                quede en ceros.
              </p>
            </div>
          </div>

          <div>
            <h2 className="max-w-2xl font-display text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-4xl">Y lo que pide una casa de verdad.</h2>
            <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {MORE.map((f) => (
                <li key={f.title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate text-lime">
                    <Icon name={f.icon} />
                  </span>
                  <span>
                    <span className="block font-semibold">{f.title}</span>
                    <span className="mt-1 block leading-relaxed text-paper/65">{f.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Comparación ---------- */}
      <section className="bg-paper text-ink">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <h2 className="max-w-3xl font-display text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-5xl">
            Hecho para la forma en que se usa la tarjeta en México.
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-ink/70">
            Las apps de gastos compartidos dividen bien la cuenta del restaurante, pero no saben qué es una fecha de corte ni unos meses sin
            intereses.
          </p>
          {/* En celular: una lista por función */}
          <ul className="mt-10 space-y-3 md:hidden">
            {COMPARE.map((r) => (
              <li key={r.row} className="rounded-2xl bg-white p-4">
                <p className="font-semibold">{r.row}</p>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <dt className="font-display font-bold">corte</dt>
                  <dd>
                    <MarkCell mark={r.corte} />
                  </dd>
                  {(
                    [
                      ["Apps de gastos", r.apps],
                      ["Hoja de cálculo", r.sheet],
                      ["Chat y notas", r.chat],
                    ] as const
                  ).map(([label, m]) => (
                    <div key={label} className="contents">
                      <dt className="text-ink/60">{label}</dt>
                      <dd>
                        <MarkCell mark={m} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
          <div className="mt-10 hidden md:block">
            <table className="w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr className="text-sm text-ink/60">
                  <th className="w-[38%] pb-4 font-medium" scope="col">
                    <span className="sr-only">Función</span>
                  </th>
                  <th className="pb-4 font-medium" scope="col">
                    Chat y notas
                  </th>
                  <th className="pb-4 font-medium" scope="col">
                    Hoja de cálculo
                  </th>
                  <th className="pb-4 font-medium" scope="col">
                    Apps de gastos
                  </th>
                  <th className="rounded-t-2xl bg-ink pb-4 pt-4 text-center font-display text-base font-bold text-paper" scope="col">
                    corte
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((r, i) => (
                  <tr key={r.row}>
                    <th scope="row" className="border-t border-ink/10 py-4 pr-4 font-medium">
                      {r.row}
                    </th>
                    {(["chat", "sheet", "apps"] as const).map((k) => (
                      <td key={k} className="border-t border-ink/10 py-4">
                        <MarkCell mark={r[k]} />
                      </td>
                    ))}
                    <td className={`bg-ink py-4 text-center ${i === COMPARE.length - 1 ? "rounded-b-2xl" : ""}`}>
                      <MarkCell mark={r.corte} highlight />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---------- Privacidad ---------- */}
      <section id="privacidad" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-5xl">Las cuentas de tu casa se quedan en tu casa.</h2>
            <p className="mt-4 text-lg leading-relaxed text-paper/70">
              corte guarda lo necesario para hacer las cuentas y nada más.{" "}
              <Link href="/privacidad" className="text-lime underline-offset-4 hover:underline">
                Lee el aviso de privacidad
              </Link>
              .
            </p>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
            {PRIVACY.map((p) => (
              <li key={p.title} className="bg-ink p-6">
                <Icon name={p.icon} className="h-6 w-6 text-lime" size={24} />
                <p className="mt-4 font-semibold">{p.title}</p>
                <p className="mt-1 text-paper/65">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- En el celular ---------- */}
      <section className="border-y border-line bg-slate-2">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-5xl">Cada quien ve lo suyo, desde su celular.</h2>
            <ul className="mt-8 space-y-5">
              {[
                ["Les mandas un link", "Entran con su cuenta de Google o su correo y eligen su nombre."],
                ["Ven cuánto les toca", "Lo de este corte, para cuándo, y las mensualidades que vienen."],
                ["El titular ve quién ya pagó", "Y cuánto falta para cubrir el total sin intereses."],
              ].map(([t, b]) => (
                <li key={t} className="flex gap-4">
                  <Icon name="check" className="mt-1 h-5 w-5 text-lime" strokeWidth={2.4} />
                  <span>
                    <span className="block font-semibold">{t}</span>
                    <span className="block text-paper/65">{b}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <PhoneMock />
        </div>
      </section>

      {/* ---------- Preguntas ---------- */}
      <section id="preguntas" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
        <h2 className="font-display text-4xl font-bold tracking-[-0.03em] sm:text-5xl">Preguntas frecuentes</h2>
        <div className="mt-10 divide-y divide-line border-y border-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center gap-4 text-lg font-semibold">
                <span className="flex-1">{f.q}</span>
                <Icon name="chevronRight" className="h-5 w-5 text-mute transition group-open:rotate-90" />
              </summary>
              <p className="mt-3 max-w-2xl leading-relaxed text-paper/70">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-paper/65">
          ¿Tienes otra duda?{" "}
          <Link href="/ayuda" className="text-lime underline-offset-4 hover:underline">
            Visita el centro de ayuda
          </Link>
          .
        </p>
      </section>

      {/* ---------- Llamado final ---------- */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-lime px-6 py-16 text-ink sm:px-14 sm:py-20">
          <CorteIcon variant="light" className="pointer-events-none absolute -right-10 -top-6 h-64 w-64 opacity-10 sm:h-96 sm:w-96" />
          <h2 className="relative max-w-2xl font-display text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-6xl">
            Que el próximo corte se pague completo y a tiempo.
          </h2>
          <p className="relative mt-4 max-w-xl text-lg text-ink/75">Crea el grupo de tu casa en un par de minutos. Es gratis.</p>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <Link href={primaryHref} className="rounded-xl bg-ink px-6 py-3.5 font-semibold text-paper transition hover:bg-slate">
              {primaryLabel}
            </Link>
            {!user && (
              <Link href="/entrar" className="rounded-xl border border-ink/25 px-6 py-3.5 font-semibold text-ink transition hover:bg-ink/5">
                Ya tengo cuenta
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Pie ---------- */}
      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <CorteLogo className="h-8 w-auto" />
            <p className="mt-3 max-w-xs text-sm text-mute">Gastos compartidos, a tiempo. Hecho en México.</p>
          </div>
          <FooterCol
            title="Producto"
            links={[
              ["Cómo funciona", "#como-funciona"],
              ["Funciones", "#funciones"],
              ["Preguntas", "#preguntas"],
            ]}
          />
          <FooterCol
            title="Cuenta"
            links={
              user
                ? [
                    ["Mis grupos", "/grupos"],
                    ["Mi cuenta", "/cuenta"],
                  ]
                : [
                    ["Entrar", "/entrar"],
                    ["Crear cuenta", "/registro"],
                  ]
            }
          />
          <FooterCol
            title="Ayuda y legal"
            links={[
              ["Centro de ayuda", "/ayuda"],
              ["Aviso de privacidad", "/privacidad"],
              ["Términos y condiciones", "/terminos"],
            ]}
          />
        </div>
      </footer>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Piezas
// ---------------------------------------------------------------------------

function MarkCell({ mark, highlight }: { mark: Mark; highlight?: boolean }) {
  if (mark === "yes") {
    return (
      <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${highlight ? "text-lime" : "text-ink"}`}>
        <Icon name="check" className="h-4 w-4" size={16} strokeWidth={2.6} />
        Sí
      </span>
    );
  }
  if (mark === "manual") return <span className="text-sm text-ink/60">A mano</span>;
  return <span className="text-sm text-ink/40">No</span>;
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-mute">
        {links.map(([label, href]) => (
          <li key={href}>
            {href.startsWith("#") ? (
              <a href={href} className="hover:text-paper">
                {label}
              </a>
            ) : (
              <Link href={href} className="hover:text-paper">
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PhoneMock() {
  return (
    <div className="mx-auto w-full max-w-[320px]" aria-hidden>
      <div className="rounded-[44px] bg-black p-3 shadow-2xl shadow-black/60 ring-1 ring-line">
        <div className="overflow-hidden rounded-[34px] bg-ink">
          <div className="flex items-center justify-between px-5 pb-3 pt-4">
            <CorteIcon className="h-6 w-6" />
            <span className="text-sm font-semibold">Casa</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C4B5FD] text-xs font-bold text-ink">B</span>
          </div>
          <div className="px-4 pb-6">
            <div className="rounded-2xl border border-line bg-slate-2 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">Tarjeta de Perla</span>
                <span className="rounded-full bg-coral/15 px-2 py-0.5 font-semibold text-coral">faltan 4 días</span>
              </div>
              <p className="mt-3 text-xs text-mute">Le debes a Perla</p>
              <p className="font-display text-3xl font-bold tabular">$1,300.00</p>
              <p className="text-xs text-mute">antes del 25 de noviembre</p>
              <div className="mt-3 rounded-xl bg-lime py-2 text-center text-sm font-semibold text-ink">Registrar mi depósito</div>
            </div>
            <p className="mb-2 mt-5 text-xs font-semibold text-mute">Lo que viene para ti</p>
            <ul className="divide-y divide-line rounded-2xl border border-line bg-slate-2 text-xs">
              {[
                ["25 de diciembre", "$1,500.00"],
                ["25 de enero", "$1,500.00"],
                ["25 de febrero", "$1,500.00"],
              ].map(([d, a]) => (
                <li key={d} className="flex justify-between px-3 py-2.5">
                  <span className="text-paper/80">Antes del {d}</span>
                  <span className="font-semibold tabular">{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
