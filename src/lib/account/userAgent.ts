/** "Chrome en Mac", "Safari en iPhone"… para que la persona reconozca sus sesiones. */
export function describeUserAgent(ua: string | null): { browser: string; os: string; mobile: boolean } {
  if (!ua) return { browser: "Navegador desconocido", os: "", mobile: false };
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /CriOS|Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Navegador";
  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Mac OS X|Macintosh/.test(ua)
          ? "Mac"
          : /Windows/.test(ua)
            ? "Windows"
            : /Linux/.test(ua)
              ? "Linux"
              : "";
  return { browser, os, mobile: /Mobile|iPhone|Android/.test(ua) };
}
