import { useEffect, useState } from "react";

/** Normaliza nombres de ciudad para comparar con los perfiles (acentos, mayúsculas). */
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const CITY_ALIASES: Record<string, string> = {
  bogota: "Bogotá",
  "bogota d.c.": "Bogotá",
  "bogota dc": "Bogotá",
  "bogota distrito capital": "Bogotá",
  medellin: "Medellín",
  cali: "Cali",
  "santiago de cali": "Cali",
  barranquilla: "Barranquilla",
  cartagena: "Cartagena",
  "cartagena de indias": "Cartagena",
  pereira: "Pereira",
  "santa marta": "Santa Marta",
  manizales: "Manizales",
  armenia: "Armenia",
  bucaramanga: "Bucaramanga",
  ibague: "Ibagué",
  cucuta: "Cúcuta",
  villavicencio: "Villavicencio",
  pasto: "Pasto",
  monteria: "Montería",
  neiva: "Neiva",
  valledupar: "Valledupar",
  popayan: "Popayán",
  sincelejo: "Sincelejo",
  riohacha: "Riohacha",
};

const canonicalCity = (raw?: string | null): string | null => {
  if (!raw) return null;
  const key = norm(raw);
  if (CITY_ALIASES[key]) return CITY_ALIASES[key];
  // Capitaliza la primera letra de cada palabra como fallback
  return raw
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
};

const STORAGE_KEY = "deseox:user-city";

type State = {
  city: string | null;
  source: "geo" | "ip" | "cache" | null;
  loading: boolean;
};

/** Detecta la ciudad del usuario (geolocalización del navegador con fallback a IP). */
export function useUserCity(): State {
  const [state, setState] = useState<State>(() => {
    if (typeof window === "undefined") return { city: null, source: null, loading: true };
    const cached = window.localStorage.getItem(STORAGE_KEY);
    return cached
      ? { city: cached, source: "cache", loading: false }
      : { city: null, source: null, loading: true };
  });

  useEffect(() => {
    let cancelled = false;

    const persist = (city: string, source: "geo" | "ip") => {
      if (cancelled) return;
      try {
        window.localStorage.setItem(STORAGE_KEY, city);
      } catch {
        /* noop */
      }
      setState({ city, source, loading: false });
    };

    const fromIp = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error("ip lookup failed");
        const data = await res.json();
        const city = canonicalCity(data?.city);
        if (city) persist(city, "ip");
        else if (!cancelled) setState((s) => ({ ...s, loading: false }));
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      }
    };

    const fromGeo = (lat: number, lon: number) =>
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=es`,
      )
        .then((r) => r.json())
        .then((data) => {
          const addr = data?.address ?? {};
          const raw =
            addr.city ||
            addr.town ||
            addr.municipality ||
            addr.village ||
            addr.county ||
            addr.state;
          const city = canonicalCity(raw);
          if (city) persist(city, "geo");
          else fromIp();
        })
        .catch(() => fromIp());

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fromGeo(pos.coords.latitude, pos.coords.longitude),
        () => fromIp(),
        { timeout: 6000, maximumAge: 1000 * 60 * 60 * 24 },
      );
    } else {
      fromIp();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
