import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, MousePointerClick, TrendingUp, Sparkles, Flame } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

interface ViewRow { created_at: string; viewer_id: string | null; viewer_fingerprint: string | null }
interface ClickRow { created_at: string }

interface Props {
  profileId: string;
}

const DAYS = 30;

const fmtDay = (d: Date) =>
  d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

const HOUR_BANDS = [
  { label: "Mañana", range: "06–12h", from: 6, to: 12 },
  { label: "Tarde", range: "12–18h", from: 12, to: 18 },
  { label: "Noche", range: "18–24h", from: 18, to: 24 },
  { label: "Madrugada", range: "00–06h", from: 0, to: 6 },
];

export const ReachStats = ({ profileId }: Props) => {
  const [views, setViews] = useState<ViewRow[]>([]);
  const [clicks, setClicks] = useState<ClickRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;
    const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();
    setLoading(true);
    Promise.all([
      supabase
        .from("profile_views")
        .select("created_at, viewer_id, viewer_fingerprint")
        .eq("profile_id", profileId)
        .gte("created_at", since),
      supabase
        .from("profile_contact_clicks")
        .select("created_at")
        .eq("profile_id", profileId)
        .gte("created_at", since),
    ]).then(([v, c]) => {
      setViews((v.data ?? []) as ViewRow[]);
      setClicks((c.data ?? []) as ClickRow[]);
      setLoading(false);
    });
  }, [profileId]);

  const stats = useMemo(() => {
    const totalViews = views.length;
    const uniqueIds = new Set<string>();
    views.forEach((v) => {
      uniqueIds.add(v.viewer_id ?? `fp:${v.viewer_fingerprint ?? "anon"}`);
    });
    const uniqueViews = uniqueIds.size;
    const totalClicks = clicks.length;
    const conversion = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    // Daily series (last 30 days)
    const days: { day: string; vistas: number; date: Date }[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({ day: fmtDay(d), vistas: 0, date: d });
    }
    const dayMap = new Map(days.map((d) => [dayKey(d.date), d]));
    views.forEach((v) => {
      const k = dayKey(new Date(v.created_at));
      const row = dayMap.get(k);
      if (row) row.vistas++;
    });

    // Peak day
    let peakDay = days[0];
    days.forEach((d) => { if (d.vistas > peakDay.vistas) peakDay = d; });

    // Hour heatmap (24h aggregated)
    const hours = Array.from({ length: 24 }, () => 0);
    views.forEach((v) => {
      hours[new Date(v.created_at).getHours()]++;
    });
    const peakHour = hours.indexOf(Math.max(...hours));
    const maxHour = Math.max(...hours, 1);

    return { totalViews, uniqueViews, totalClicks, conversion, days, peakDay, hours, peakHour, maxHour };
  }, [views, clicks]);

  return (
    <section
      className={cn(
        "rounded-[28px] bg-black/80 backdrop-blur-xl",
        "border border-white/5",
        "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(212,175,55,0.08),inset_0_1px_0_rgba(255,255,255,0.04)]",
        "p-5 sm:p-6 space-y-5",
      )}
    >
      <header className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-400/40 text-amber-300 shadow-[0_0_15px_rgba(212,175,55,0.25)]">
          <TrendingUp className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-base font-bold text-white leading-tight">Estadísticas de Alcance</h2>
          <p className="text-[11px] text-white/40 leading-tight mt-0.5">Últimos 30 días · datos en tiempo real</p>
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard
          icon={<Eye className="h-4 w-4" />}
          label="Vistas del Mes"
          value={loading ? "—" : stats.totalViews.toLocaleString("es-CO")}
          sub={`${stats.uniqueViews.toLocaleString("es-CO")} visitantes únicos`}
        />
        <KpiCard
          icon={<MousePointerClick className="h-4 w-4" />}
          label="Interés Real"
          value={loading ? "—" : `${stats.conversion.toFixed(1)}%`}
          sub={`${stats.totalClicks.toLocaleString("es-CO")} clics en contacto`}
        />
        <KpiCard
          icon={<Flame className="h-4 w-4" />}
          label="Pico de Tráfico"
          value={loading ? "—" : `${stats.peakDay.day}`}
          sub={loading ? "" : `${String(stats.peakHour).padStart(2, "0")}:00 · ${stats.peakDay.vistas} vistas`}
        />
      </div>

      {/* Area chart */}
      <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wider text-white/50 font-bold">Evolución de vistas</p>
          <p className="text-[10px] text-white/30">Últimos 30 días</p>
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.days} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(45 80% 60%)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="hsl(45 80% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="day"
                stroke="rgba(255,255,255,0.4)"
                tick={{ fontSize: 10 }}
                interval={Math.ceil(DAYS / 8)}
              />
              <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(0,0,0,0.9)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(45 80% 70%)" }}
              />
              <Area
                type="monotone"
                dataKey="vistas"
                stroke="hsl(45 80% 60%)"
                strokeWidth={2}
                fill="url(#goldFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hour heatmap */}
      <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wider text-white/50 font-bold">Mapa de Calor Horario</p>
          <p className="text-[10px] text-white/30">¿Cuándo subir nuevas fotos?</p>
        </div>
        <div className="grid grid-cols-12 gap-1">
          {stats.hours.map((count, h) => {
            const intensity = count / stats.maxHour;
            return (
              <div
                key={h}
                title={`${String(h).padStart(2, "0")}:00 — ${count} vistas`}
                className="aspect-square rounded-md flex items-center justify-center text-[9px] font-bold text-white/70"
                style={{
                  background: `rgba(212, 175, 55, ${0.08 + intensity * 0.85})`,
                  boxShadow: intensity > 0.7 ? "0 0 8px rgba(212,175,55,0.5)" : undefined,
                }}
              >
                {h}
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          {HOUR_BANDS.map((b) => {
            const sum = stats.hours.slice(b.from, b.to).reduce((a, n) => a + n, 0);
            return (
              <div key={b.label} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">{b.label}</p>
                <p className="text-sm font-bold text-amber-300">{sum}</p>
                <p className="text-[10px] text-white/30">{b.range}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational footer */}
      <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent p-4 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
          <Sparkles className="h-4 w-4" />
        </span>
        <p className="text-sm text-white/80">
          Tu perfil está en el <span className="font-bold text-amber-300">Top 10% de actividad hoy</span>. ¡Sigue así!
        </p>
      </div>
    </section>
  );
};

const KpiCard = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) => (
  <div className="relative overflow-hidden rounded-2xl border border-amber-400/15 bg-gradient-to-br from-amber-500/[0.06] to-black/60 p-4">
    <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-400/20 blur-2xl" />
    <div className="flex items-center gap-2 text-amber-300">
      {icon}
      <span className="text-[10px] uppercase tracking-wider font-bold text-white/50">{label}</span>
    </div>
    <p className="font-display text-2xl font-extrabold text-white mt-2">{value}</p>
    <p className="text-[11px] text-white/40 mt-0.5 truncate">{sub}</p>
  </div>
);
