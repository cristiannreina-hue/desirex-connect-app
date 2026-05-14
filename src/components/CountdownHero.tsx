import { useEffect, useState } from "react";
import { getCountdown } from "@/lib/launch";

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
  const [parts, setParts] = useState(getCountdown());

  useEffect(() => {
    const id = setInterval(() => setParts(getCountdown()), 1000);
    return () => clearInterval(id);
  }, []);

  if (parts.finished) return null;

  return (
    <div className="mx-auto mt-6 mb-2 inline-flex flex-col items-center rounded-3xl border border-white/10 bg-black/35 backdrop-blur-2xl px-5 py-4 sm:px-7 sm:py-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
      <span
        className="text-[10px] sm:text-xs uppercase tracking-[0.32em] font-semibold"
        style={{ color: GOLD }}
      >
        Pre-Lanzamiento Oficial · 15 Jun 2026
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
