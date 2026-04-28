import { useEffect } from "react";

/** Inserta <meta name="robots" content="noindex,nofollow"> en rutas internas. */
export const SeoNoIndex = () => {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);
  return null;
};
