import type { Metadata } from "next";
import { SettingsGroup, SettingsHeader, SettingsRow } from "@/components/settings";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Privacidad y datos" };

const FACTS = [
  { icon: "ban" as const, title: "No vendemos tus datos", body: "Ni los usamos para publicidad. corte no tiene anuncios." },
  { icon: "card" as const, title: "Nunca pedimos tu tarjeta", body: "Ni el número completo, ni CVV, ni NIP. Solo, si quieres, los últimos 4 dígitos para reconocerla." },
  { icon: "bank" as const, title: "No nos conectamos a tu banco", body: "Los montos los registran ustedes. corte no mueve dinero." },
  { icon: "lock" as const, title: "Tu contraseña va cifrada", body: "Nadie, ni nosotros, puede leerla." },
];

export default function PrivacySettingsPage() {
  return (
    <>
      <SettingsHeader title="Privacidad y datos" subtitle="Tus datos son tuyos." />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {FACTS.map((f) => (
          <div key={f.title} className="rounded-2xl border border-line bg-slate-2 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate text-lime">
              <Icon name={f.icon} />
            </span>
            <p className="mt-2 font-semibold">{f.title}</p>
            <p className="text-sm text-mute">{f.body}</p>
          </div>
        ))}
      </div>

      <SettingsGroup title="Tus datos" footer="El archivo incluye tu cuenta, tus sesiones y todo lo de tus grupos: personas, tarjetas, gastos y pagos.">
        <SettingsRow icon={<Icon name="download" />} label="Descargar mis datos" detail="Archivo JSON" href="/api/cuenta/exportar" />
      </SettingsGroup>

      <SettingsGroup title="Documentos">
        <SettingsRow icon={<Icon name="lock" />} label="Aviso de privacidad" detail="Qué guardamos, para qué y tus derechos ARCO" href="/privacidad" />
        <SettingsRow icon={<Icon name="file" />} label="Términos y condiciones" href="/terminos" />
      </SettingsGroup>

      <SettingsGroup title="Zona de peligro">
        <SettingsRow icon={<Icon name="trash" />} label="Eliminar cuenta" detail="Borra tu cuenta para siempre" href="/cuenta/eliminar" tone="danger" />
      </SettingsGroup>
    </>
  );
}
