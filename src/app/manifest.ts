import type { MetadataRoute } from "next";

/** Hace que corte se pueda instalar desde el navegador ("Agregar a pantalla de inicio"). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "corte: gastos compartidos, a tiempo",
    short_name: "corte",
    description: "Reparte los gastos de la casa y controla la tarjeta que usan todos: cortes, fechas límite y meses sin intereses.",
    lang: "es-MX",
    start_url: "/grupos",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#121417",
    theme_color: "#121417",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Mis grupos", url: "/grupos" },
      { name: "Mi cuenta", url: "/cuenta" },
    ],
  };
}
