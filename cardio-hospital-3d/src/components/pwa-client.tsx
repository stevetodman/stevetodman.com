"use client";

import { useEffect } from "react";

export default function PwaClient() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    const register = () => {
      void navigator.serviceWorker.register("/hospital/sw.js", { scope: "/hospital/" }).catch((error) => {
        console.warn("Pediatric Hospital service worker registration failed.", error);
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
