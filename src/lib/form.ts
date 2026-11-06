/** Estado que regresan las acciones de los formularios. */
export type FormState = { error?: string; ok?: string } | undefined;

/** Solo permite regresar a rutas internas (evita redirecciones a otros sitios). */
export function safeNext(v: unknown, fallback = "/grupos"): string {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : fallback;
}
