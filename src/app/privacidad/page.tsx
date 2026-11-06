import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Aviso de privacidad" };

export default function PrivacyPage() {
  const mail = <a className="text-lime hover:underline" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;
  return (
    <LegalPage
      title="Aviso de privacidad"
      intro={`En ${SITE.name} solo guardamos lo necesario para que puedas repartir gastos con tu grupo. No vendemos tus datos ni los usamos para publicidad.`}
    >
      <LegalSection title="Quién es responsable de tus datos">
        <p>
          {SITE.owner} es responsable del tratamiento de los datos personales que se recaban en {SITE.name}. Para cualquier tema de privacidad
          escríbenos a {mail}.
        </p>
      </LegalSection>

      <LegalSection title="Qué datos guardamos">
        <ul>
          <li>
            <b>De tu cuenta:</b> nombre, correo electrónico y tu contraseña guardada de forma cifrada (nunca en texto). Si entras con Google, el
            identificador que Google nos da para tu cuenta.
          </li>
          <li>
            <b>De tus grupos:</b> los nombres de las personas, tarjetas (nombre, titular, día de corte y, si quieres, los últimos 4 dígitos), gastos y
            pagos que registran tú y los demás miembros.
          </li>
          <li>
            <b>Técnicos:</b> el tipo de navegador y sistema de cada sesión, para que puedas ver y cerrar tus sesiones abiertas.
          </li>
        </ul>
        <p>
          <b>No pedimos ni guardamos</b> números completos de tarjeta, CVV, NIP, contraseñas de tu banco ni datos para cobrarte. {SITE.name} no se
          conecta con tu banco.
        </p>
      </LegalSection>

      <LegalSection title="Para qué los usamos">
        <ul>
          <li>Crear y mantener tu cuenta e iniciar sesión.</li>
          <li>Calcular cortes, mensualidades, saldos y lo que le toca a cada persona.</li>
          <li>Mostrar la información de un grupo a las personas que pertenecen a él.</li>
          <li>Proteger tu cuenta (por ejemplo, detectar sesiones que no reconoces).</li>
        </ul>
        <p>No usamos tus datos para publicidad ni para crear perfiles de consumo.</p>
      </LegalSection>

      <LegalSection title="Datos de otras personas">
        <p>
          Cuando agregas a alguien a un grupo (por ejemplo, a tu mamá), registras su nombre y los gastos que le corresponden. Al hacerlo nos dices que
          esa persona está de acuerdo. Si alguien quiere que se quite su información de un grupo, puede pedírselo a un admin del grupo o escribirnos.
        </p>
      </LegalSection>

      <LegalSection title="Con quién los compartimos">
        <p>
          Solo con los miembros de tus grupos y con los proveedores que necesitamos para que la app funcione (alojamiento y base de datos), que no
          pueden usarlos para nada más. Si inicias sesión con Google, Google sabe que usas {SITE.name}. Fuera de eso, solo los compartiríamos si una
          autoridad competente lo exige conforme a la ley.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Usamos una sola cookie esencial para mantener tu sesión abierta y otra temporal durante el inicio con Google. No usamos cookies de
          publicidad ni de rastreo.
        </p>
      </LegalSection>

      <LegalSection title="Tus derechos (ARCO)">
        <p>Puedes acceder, rectificar, cancelar u oponerte al uso de tus datos. La mayoría lo puedes hacer tú mismo desde la app:</p>
        <ul>
          <li>
            <b>Acceso:</b> en <Link className="text-lime hover:underline" href="/cuenta/privacidad">Mi cuenta → Privacidad y datos → Descargar mis datos</Link>.
          </li>
          <li>
            <b>Rectificación:</b> cambia tu nombre y correo en <Link className="text-lime hover:underline" href="/cuenta/perfil">Mi cuenta</Link>.
          </li>
          <li>
            <b>Cancelación:</b> en <Link className="text-lime hover:underline" href="/cuenta/eliminar">Mi cuenta → Eliminar cuenta</Link>.
          </li>
        </ul>
        <p>Para cualquier otra solicitud escríbenos a {mail}. Te respondemos en un plazo máximo de 20 días hábiles.</p>
      </LegalSection>

      <LegalSection title="Cuánto tiempo los guardamos">
        <p>
          Mientras tengas tu cuenta. Si la eliminas, borramos tu cuenta y tus sesiones de inmediato. En los grupos compartidos tu nombre se queda como
          persona sin cuenta para que las cuentas de los demás no se descuadren; un admin puede renombrarte o eliminar el grupo.
        </p>
      </LegalSection>

      <LegalSection title="Cambios a este aviso">
        <p>Si cambiamos algo importante te lo avisaremos dentro de la app. La fecha de arriba indica la última versión.</p>
      </LegalSection>
    </LegalPage>
  );
}
