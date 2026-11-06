import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Términos y condiciones"
      intro={`Al crear una cuenta o usar ${SITE.name} aceptas estos términos. Están escritos para entenderse a la primera.`}
    >
      <LegalSection title={`Qué es ${SITE.name}`}>
        <p>
          Una herramienta para registrar gastos compartidos y calcular cuánto le toca a cada persona, incluyendo fechas de corte y compras a meses sin
          intereses de tarjetas que usa un grupo.
        </p>
      </LegalSection>

      <LegalSection title={`Lo que ${SITE.name} no es`}>
        <ul>
          <li>No es un banco, ni una institución financiera, ni mueve dinero. Los pagos entre personas los hacen ustedes por fuera.</li>
          <li>No da asesoría financiera.</li>
          <li>
            Los cálculos son informativos y dependen de lo que se registra. La fecha de corte, la fecha límite y el monto a pagar que valen son los de
            tu estado de cuenta del banco. Compáralos siempre antes de pagar.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Tu cuenta">
        <ul>
          <li>Eres responsable de lo que se haga con tu cuenta. Usa una contraseña segura y no la compartas.</li>
          <li>Debes tener al menos 18 años, o usar la app con permiso de tus padres o tutores.</li>
          <li>
            Puedes eliminar tu cuenta cuando quieras desde <Link className="text-lime hover:underline" href="/cuenta/eliminar">Mi cuenta</Link>.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Grupos y lo que registras">
        <ul>
          <li>Lo que registras en un grupo lo ven y pueden editar los demás miembros de ese grupo.</li>
          <li>Registra solo información verdadera y de personas que estén de acuerdo en aparecer.</li>
          <li>No uses la app para nada ilegal, para acosar a alguien ni para intentar entrar a cuentas o grupos ajenos.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Disponibilidad">
        <p>
          Hacemos lo posible para que {SITE.name} funcione siempre y sin errores, pero no podemos garantizarlo. Te recomendamos descargar tus datos de
          vez en cuando. No somos responsables por intereses, comisiones u otros cargos que cobre tu banco.
        </p>
      </LegalSection>

      <LegalSection title="Cambios">
        <p>
          Podemos actualizar estos términos. Si el cambio es importante te avisaremos en la app; seguir usándola después significa que lo aceptas.
        </p>
      </LegalSection>

      <LegalSection title="Ley aplicable">
        <p>Estos términos se rigen por las leyes de los Estados Unidos Mexicanos.</p>
        <p>
          Dudas: <a className="text-lime hover:underline" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
