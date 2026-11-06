import type { Metadata } from "next";
import Link from "next/link";
import { CorteLogo } from "@/components/brand/Logo";
import { SettingsGroup, SettingsRow } from "@/components/settings";
import { getCurrentUser } from "@/lib/auth/session";
import { SITE } from "@/lib/site";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Centro de ayuda" };

const FAQ: { cat: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    cat: "Primeros pasos",
    items: [
      {
        q: "¿Qué es corte?",
        a: "Una app para repartir gastos con tu familia, roomies o amigos. Además lleva el control de una tarjeta de crédito que usan varios: en qué corte cae cada cargo, cuánto le toca a cada quien y para cuándo hay que pagarlo.",
      },
      {
        q: "¿Cómo empiezo?",
        a: "Crea un grupo, agrega a las personas (aunque no tengan cuenta), da de alta la tarjeta con su día de corte y registra los gastos. Si quieres ver cómo funciona antes, crea el grupo de ejemplo desde Mis grupos.",
      },
      {
        q: "¿Cuesta algo?",
        a: "No. corte es gratis.",
      },
    ],
  },
  {
    cat: "Tarjetas y fechas de corte",
    items: [
      {
        q: "¿Qué es la fecha de corte?",
        a: "Es el día en que el banco cierra tu estado de cuenta. Todo lo que compras hasta ese día entra en ese estado de cuenta; lo que compras un día después se va al siguiente.",
      },
      {
        q: "¿Y la fecha límite de pago?",
        a: "Es el último día para pagar el total sin que te cobren intereses, normalmente unos 20 días después del corte. En corte la configuras como “días para pagar”.",
      },
      {
        q: "¿Cómo funcionan los meses sin intereses?",
        a: "Registras la compra una vez y eliges los meses. corte divide el total en mensualidades y pone una en cada corte. Si no se divide exacto, la última mensualidad se lleva los centavos que sobran.",
      },
      {
        q: "El total no me cuadra con mi estado de cuenta",
        a: "En la pantalla del corte puedes escribir el total que dice tu banco y corte te dice cuánto falta o sobra. Normalmente es un cargo que no se registró, o uno con la fecha equivocada.",
      },
    ],
  },
  {
    cat: "Grupos y personas",
    items: [
      {
        q: "¿Puedo agregar a alguien que no tiene cuenta?",
        a: "Sí. Agrégalo por nombre en Personas. Si después se une con el código del grupo, elige su nombre y ve todo lo que ya tenía.",
      },
      {
        q: "¿Cómo invito a alguien?",
        a: "En Personas copia el link de invitación o pásale el código de 6 letras. Si el código llega a quien no debe, un admin lo puede cambiar.",
      },
      {
        q: "¿Quién puede editar los gastos?",
        a: "Cualquier persona del grupo con cuenta. Los admins además pueden cambiar el código, nombrar a otros admins y eliminar el grupo.",
      },
      {
        q: "¿Qué pasa si me salgo de un grupo?",
        a: "Dejas de verlo, pero tu nombre se queda como persona sin cuenta para que las cuentas de los demás no cambien.",
      },
    ],
  },
  {
    cat: "Cuenta y seguridad",
    items: [
      {
        q: "Olvidé mi contraseña",
        a: (
          <>
            Si tu cuenta tiene Google vinculado, entra con Google y crea una nueva en Mi cuenta → Inicio de sesión y seguridad. Si no, escríbenos a{" "}
            <a className="text-lime hover:underline" href={`mailto:${SITE.contactEmail}`}>
              {SITE.contactEmail}
            </a>
            .
          </>
        ),
      },
      {
        q: "¿Cómo cierro sesión en otro dispositivo?",
        a: "En Mi cuenta → Sesiones abiertas puedes cerrar cualquier sesión o todas menos la actual.",
      },
      {
        q: "¿Cómo elimino mi cuenta?",
        a: "En Mi cuenta → Eliminar cuenta. Antes puedes descargar tus datos.",
      },
    ],
  },
];

export default async function HelpPage() {
  const user = await getCurrentUser();
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-6 sm:px-6">
      <div className="flex items-center justify-between">
        <Link href={user ? "/cuenta" : "/"} className="inline-flex items-center gap-1 text-sm text-mute hover:text-paper">
          <Icon name="chevronLeft" className="h-4 w-4" /> {user ? "Mi cuenta" : "Inicio"}
        </Link>
        <CorteLogo className="h-7 w-auto" />
      </div>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Centro de ayuda</h1>
      <p className="mt-1 text-mute">Respuestas rápidas a lo que más nos preguntan.</p>

      <div className="mt-8 space-y-8">
        {FAQ.map((section) => (
          <section key={section.cat}>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-mute">{section.cat}</h2>
            <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-slate-2">
              {section.items.map((item) => (
                <details key={item.q} className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 font-medium transition hover:bg-slate/60">
                    <span className="flex-1">{item.q}</span>
                    <Icon name="chevronRight" className="h-4 w-4 text-mute transition group-open:rotate-90" />
                  </summary>
                  <div className="px-4 pb-4 text-sm leading-relaxed text-paper/75">{item.a}</div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10">
        <SettingsGroup title="¿No encontraste tu respuesta?">
          <SettingsRow icon={<Icon name="message" />} label="Escríbenos" detail={SITE.contactEmail} href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Ayuda con corte")}`} />
        </SettingsGroup>
      </div>
    </main>
  );
}
