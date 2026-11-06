/**
 * Datos de quien opera la app. Cámbialos antes de publicar: aparecen en el
 * Aviso de privacidad y en los Términos.
 */
export const SITE = {
  name: "corte",
  appUrl: (process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL ? "https://app.corte.mariobencomodev.com" : "http://localhost:3000")).replace(/\/$/, ""),
  /** Persona o empresa responsable de los datos */
  owner: "Mario Bencomo",
  /** Correo para dudas y solicitudes de privacidad (pon uno real antes de publicar) */
  contactEmail: "privacidad@ejemplo.com",
  /** Fecha de la última actualización de los documentos legales */
  legalUpdated: "5 de noviembre de 2026",
};
