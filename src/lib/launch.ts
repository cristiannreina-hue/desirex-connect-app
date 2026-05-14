// Configuración del pre-lanzamiento oficial
// Fecha límite: 15 de junio de 2026, 00:00 (hora local Colombia, UTC-5)
export const LAUNCH_DATE = new Date("2026-06-15T00:00:00-05:00");

export const isPreLaunch = () => Date.now() < LAUNCH_DATE.getTime();

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  finished: boolean;
}

export function getCountdown(target: Date = LAUNCH_DATE): CountdownParts {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds, finished: false };
}
