import type { Rates } from "@/types/profile";

const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export const formatCOP = (value: number) => cop.format(value);

export const minRate = (rates: Rates): number | null => {
  const values = [rates.short, rates.oneHour, rates.twoHours, rates.fullDay].filter(
    (v): v is number => typeof v === "number",
  );
  return values.length ? Math.min(...values) : null;
};

export const RATE_LABELS: Record<keyof Rates, string> = {
  short: "Sesión corta",
  oneHour: "1 hora",
  twoHours: "2 horas",
  fullDay: "Jornada completa",
};
