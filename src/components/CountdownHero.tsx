import { useEffect, useState } from "react";
import { getCountdown, LAUNCH_DATE } from "@/lib/launch";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const GOLD = "#D4AF37";

function Cell({ value, label }: { value: number; label: string }) {
  const v = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-2xl border border-white/15 bg-black/40 backdrop-blur-xl px-3 py-2 sm:px-4 sm:py-3 min-w-[64px] sm:min-w-[84px] text-center shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
        style={{ boxShadow: `inset 0 0 0 1px rgba(212,175,55,0.18), 0 8px 32px rgba(0,0,0,0.45)` }}
      >
        <span
          className="font-mono tabular-nums text-2xl sm:text-4xl font-bold leading-none tracking-wider"
          style={{ color: GOLD, textShadow: `0 0 18px rgba(212,175,55,0.55)` }}
        >
          {v}
        </span>
      </div>
      <span className="mt-2 text-[10px] sm:text-xs uppercase tracking-[0.18em] text-white/70">
        {label}
      </span>
    </div>
  );
}

export function CountdownHero() {
  const { settings } = useSiteSettings();
  const target = settings.launch_date ? new Date(settings.launch_date) : LAUNCH_DATE;
  const [parts, setParts] = useState(getCountdown(target));

  useEffect(() => {
    setParts(getCountdown(target));
    const id = setInterval(() => setParts(getCountdown(target)), 1000);
    return () => clearInterval(id);
  }, [target.getTime()]);

  if (parts.finished) return null;

  const label = target.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="mx-auto mt-6 mb-2 inline-flex flex-col items-center rounded-3xl border border-white/10 bg-black/35 backdrop-blur-2xl px-5 py-4 sm:px-7 sm:py-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
      <span
        className="text-[10px] sm:text-xs uppercase tracking-[0.32em] font-semibold"
        style={{ color: GOLD }}
      >
        Pre-Lanzamiento Oficial · {label}
      </span>
      <div className="mt-3 flex items-end gap-2 sm:gap-3">
        <Cell value={parts.days} label="Días" />
        <Cell value={parts.hours} label="Horas" />
        <Cell value={parts.minutes} label="Min" />
        <Cell value={parts.seconds} label="Seg" />
      </div>
    </div>
  );
}
