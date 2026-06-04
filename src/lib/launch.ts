// Configuración del pre-lanzamiento oficial.
// La fecha real se controla desde el panel admin (tabla site_settings.launch_date).
// Este valor solo se usa como fallback si aún no se ha cargado la configuración.
export const LAUNCH_DATE = new Date("2020-01-01T00:00:00-05:00");

export const isPreLaunchFor = (target: Date) => Date.now() < target.getTime();
export const isPreLaunch = () => isPreLaunchFor(LAUNCH_DATE);

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
