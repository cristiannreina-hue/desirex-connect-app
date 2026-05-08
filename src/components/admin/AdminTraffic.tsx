import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Users, Globe, Flame, TrendingUp, Sparkles } from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

interface VisitRow {
  created_at: string;
  visitor_id: string | null;
  visitor_fingerprint: string | null;
  path: string;
}

const DAYS = 30;
const fmtDay = (d: Date) => d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
// Clave por día en zona horaria LOCAL (evita desfases con UTC que hacían que
// las visitas nocturnas se contaran en el día siguiente).
const dayKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const HOUR_BANDS = [
  { label: "Mañana", range: "06–12h", from: 6, to: 12 },
  { label: "Tarde", range: "12–18h", from: 12, to: 18 },
  { label: "Noche", range: "18–24h", from: 18, to: 24 },
  { label: "Madrugada", range: "00–06h", from: 0, to: 6 },
];

export const AdminTraffic = () => {
  const [rows, setRows] = useState<VisitRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();
    supabase
      .from("site_visits")
      .select("created_at, visitor_id, visitor_fingerprint, path")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20000)
      .then(({ data }) => {
        setRows((data ?? []) as VisitRow[]);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const unique = new Set<string>();
    const todayUniqueSet = new Set<string>();
    const todayKey = dayKey(new Date());
    let todayViews = 0;
    rows.forEach((r) => {
      const id = r.visitor_id ?? `fp:${r.visitor_fingerprint ?? "anon"}`;
      unique.add(id);
      if (dayKey(new Date(r.created_at)) === todayKey) {
        todayUniqueSet.add(id);
        todayViews++;
      }
    });

    const days: { day: string; visitas: number; date: Date }[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({ day: fmtDay(d), visitas: 0, date: d });
    }
    const dayMap = new Map(days.map((d) => [dayKey(d.date), d]));
    rows.forEach((r) => {
      const k = dayKey(new Date(r.created_at));
      const row = dayMap.get(k);
      if (row) row.visitas++;
    });

    let peakDay = days[0];
    days.forEach((d) => { if (d.visitas > peakDay.visitas) peakDay = d; });

    const hours = Array.from({ length: 24 }, () => 0);
    rows.forEach((r) => { hours[new Date(r.created_at).getHours()]++; });
    const peakHour = hours.indexOf(Math.max(...hours));
    const maxHour = Math.max(...hours, 1);

    const pathCounts = new Map<string, number>();
    rows.forEach((r) => pathCounts.set(r.path, (pathCounts.get(r.path) ?? 0) + 1));
    const topPaths = [...pathCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      total,
      unique: unique.size,
      todayUnique: todayUniqueSet.size,
      todayViews,
      days,
      peakDay,
      hours,
      peakHour,
      maxHour,
      topPaths,
    };
  }, [rows]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi icon={<Eye className="h-5 w-5" />} label="Vistas de página (30d)" value={loading ? "—" : stats.total.toLocaleString("es-CO")} sub={loading ? "" : `Hoy: ${stats.todayViews.toLocaleString("es-CO")}`} />
        <Kpi icon={<Users className="h-5 w-5" />} label="Visitantes únicos (30d)" value={loading ? "—" : stats.unique.toLocaleString("es-CO")} />
        <Kpi icon={<TrendingUp className="h-5 w-5" />} label="Visitantes únicos hoy" value={loading ? "—" : stats.todayUnique.toLocaleString("es-CO")} sub={loading ? "" : `${stats.todayViews.toLocaleString("es-CO")} vistas hoy`} />
        <Kpi icon={<Flame className="h-5 w-5" />} label="Pico" value={loading ? "—" : stats.peakDay.day} sub={loading ? "" : `${stats.peakDay.visitas} visitas · ${String(stats.peakHour).padStart(2, "0")}:00`} />
      </div>

      <div className="card-glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-amber-400" /> Tráfico diario</h3>
          <p className="text-[10px] text-muted-foreground">Últimos 30 días</p>
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.days} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="adminGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(45 80% 60%)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="hsl(45 80% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} interval={Math.ceil(DAYS / 8)} />
              <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "hsl(45 80% 70%)" }}
              />
              <Area type="monotone" dataKey="visitas" stroke="hsl(45 80% 60%)" strokeWidth={2} fill="url(#adminGold)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-400" /> Mapa de calor horario</h3>
            <p className="text-[10px] text-muted-foreground">Horas más activas</p>
          </div>
          <div className="grid grid-cols-12 gap-1">
            {stats.hours.map((count, h) => {
              const intensity = count / stats.maxHour;
              return (
                <div
                  key={h}
                  title={`${String(h).padStart(2, "0")}:00 — ${count} visitas`}
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
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{b.label}</p>
                  <p className="text-sm font-bold text-amber-300">{sum}</p>
                  <p className="text-[10px] text-muted-foreground">{b.range}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base font-bold flex items-center gap-2"><Globe className="h-4 w-4 text-amber-400" /> Páginas más visitadas</h3>
            <p className="text-[10px] text-muted-foreground">Top 5 (30d)</p>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : stats.topPaths.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay datos.</p>
          ) : (
            <ul className="space-y-2">
              {stats.topPaths.map(([path, n]) => {
                const max = stats.topPaths[0][1];
                const pct = (n / max) * 100;
                return (
                  <li key={path}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="truncate text-white/80">{path || "/"}</span>
                      <span className="text-amber-300 font-bold">{n.toLocaleString("es-CO")}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-600" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const Kpi = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) => (
  <div className="card-glass card-lift rounded-2xl p-5 relative overflow-hidden">
    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 opacity-20 blur-2xl" />
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-glow-soft mb-3">
      {icon}
    </span>
    <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="font-display text-3xl font-extrabold tracking-tight mt-1">{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
  </div>
);
