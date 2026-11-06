// Service worker mínimo de corte.
// No guarda datos de la cuenta: solo deja la app instalable y muestra
// una pantalla amable si no hay internet.
const OFFLINE = "/offline.html";
const CACHE = "corte-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE, "/icons/icon-192.png"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  // Solo navegaciones: si no hay red, mostrar la página sin conexión
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)));
});
