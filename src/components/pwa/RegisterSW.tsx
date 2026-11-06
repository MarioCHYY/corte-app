"use client";

import { useEffect } from "react";

/** Registra el service worker para que la app se pueda instalar. */
export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return; // en desarrollo no, para no guardar versiones viejas
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
