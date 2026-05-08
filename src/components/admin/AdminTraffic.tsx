import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Users, Globe, Flame, TrendingUp, CalendarDays } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

interface VisitRow {
  created_at: string;
  visitor_id: string | null;
  visitor_fingerprint: string | null;
  path: string;
}

type Granularity = "hour" | "day" | "week";

const DAYS = 30;
const WEEKS = 12;

const fmtDay = (d: Date) => d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
const fmtHour = (h: number) => `${String(h).padStart(2, "0")}:00`;
// Clave por día en zona horaria LOCAL.
const dayKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
// Lunes como inicio de semana
const startOfWeek = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // 0 = lunes
  x.setDate(x.getDate() - day);
  return x;
};
const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const AdminTraffic = () => {
  const [rows, setRows] = useState<VisitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [gran, setGran] = useState<Granularity>("day");

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

    // ---- Series por hora (hoy, 24h)
    const hourSeries: { label: string; visitas: number }[] = Array.from({ length: 24 }, (_, h) => ({
      label: fmtHour(h),
      visitas: 0,
    }));
    rows.forEach((r) => {
      const d = new Date(r.created_at);
      if (dayKey(d) === todayKey) hourSeries[d.getHours()].visitas++;
    });

    // ---- Serie por día (últimos 30)
    const daySeries: { label: string; visitas: number; date: Date }[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      daySeries.push({ label: fmtDay(d), visitas: 0, date: d });
    }
    const dayMap = new Map(daySeries.map((d) => [dayKey(d.date), d]));
    rows.forEach((r) => {
      const row = dayMap.get(dayKey(new Date(r.created_at)));
      if (row) row.visitas++;
    });

    // ---- Serie por semana (últimas 12)
    const weekSeries: { label: string; visitas: number; date: Date }[] = [];
    const thisWeek = startOfWeek(new Date());
    for (let i = WEEKS - 1; i >= 0; i--) {
      const d = new Date(thisWeek);
      d.setDate(d.getDate() - i * 7);
      weekSeries.push({ label: fmtDay(d), visitas: 0, date: d });
    }
    const weekMap = new Map(weekSeries.map((w) => [dayKey(w.date), w]));
    rows.forEach((r) => {
      const w = startOfWeek(new Date(r.created_at));
      const row = weekMap.get(dayKey(w));
      if (row) row.visitas++;
    });

    let peakDay = daySeries[0];
    daySeries.forEach((d) => { if (d.visitas > peakDay.visitas) peakDay = d; });

    const peakHourIdx = hourSeries.reduce((best, cur, i, arr) => cur.visitas > arr[best].visitas ? i : best, 0);

    // ---- Día de la semana (promedio por día)
    const weekdaySum = Array(7).fill(0);
    const weekdayCount = Array(7).fill(0);
    const seenDays = new Set<string>();
    rows.forEach((r) => {
      const d = new Date(r.created_at);
      const wd = (d.getDay() + 6) % 7;
      weekdaySum[wd]++;
      const k = dayKey(d);
      const dayMarker = `${wd}:${k}`;
      if (!seenDays.has(dayMarker)) {
        seenDays.add(dayMarker);
        weekdayCount[wd]++;
      }
    });
    const weekdaySeries = WEEKDAY_LABELS.map((label, i) => ({
      label,
      promedio: weekdayCount[i] ? Math.round(weekdaySum[i] / weekdayCount[i]) : 0,
      total: weekdaySum[i],
    }));

    const pathCounts = new Map<string, number>();
    rows.forEach((r) => pathCounts.set(r.path, (pathCounts.get(r.path) ?? 0) + 1));
    const topPaths = [...pathCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      total,
      unique: unique.size,
      todayUnique: todayUniqueSet.size,
      todayViews,
      hourSeries,
      daySeries,
      weekSeries,
      weekdaySeries,
      peakDay,
      peakHour: peakHourIdx,
      topPaths,
    };
  }, [rows]);

  const activeSeries =
    gran === "hour" ? stats.hourSeries :
    gran === "week" ? stats.weekSeries :
    stats.daySeries;

  const granLabels: Record<Granularity, { title: string; sub: string }> = {
    hour: { title: "Tráfico por hora", sub: "Hoy · 24 horas" },
    day: { title: "Tráfico diario", sub: "Últimos 30 días" },
    week: { title: "Tráfico semanal", sub: "Últimas 12 semanas" },
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi icon={<Eye className="h-5 w-5" />} label="Vistas de página (30d)" value={loading ? "—" : stats.total.toLocaleString("es-CO")} sub={loading ? "" : `Hoy: ${stats.todayViews.toLocaleString("es-CO")}`} />
        <Kpi icon={<Users className="h-5 w-5" />} label="Visitantes únicos (30d)" value={loading ? "—" : stats.unique.toLocaleString("es-CO")} />
        <Kpi icon={<TrendingUp className="h-5 w-5" />} label="Visitantes únicos hoy" value={loading ? "—" : stats.todayUnique.toLocaleString("es-CO")} sub={loading ? "" : `${stats.todayViews.toLocaleString("es-CO")} vistas hoy`} />
        <Kpi icon={<Flame className="h-5 w-5" />} label="Pico" value={loading ? "—" : stats.peakDay.label} sub={loading ? "" : `${stats.peakDay.visitas} visitas · ${fmtHour(stats.peakHour)}`} />
      </div>

      <div className="card-glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div>
            <h3 className="font-display text-base font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-amber-400" /> {granLabels[gran].title}</h3>
            <p className="text-[10px] text-muted-foreground">{granLabels[gran].sub}</p>
          </div>
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1 text-xs">
            {(["hour", "day", "week"] as Granularity[]).map((g) => (
              <button
                key={g}
                onClick={() => setGran(g)}
                className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                  gran === g
                    ? "bg-gradient-to-r from-amber-400 to-yellow-600 text-black shadow-glow-soft"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {g === "hour" ? "Hora" : g === "day" ? "Día" : "Semana"}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeSeries} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="adminGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(45 80% 60%)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="hsl(45 80% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="label"
                stroke="rgba(255,255,255,0.4)"
                tick={{ fontSize: 10 }}
                interval={gran === "hour" ? 2 : gran === "day" ? Math.ceil(DAYS / 8) : 0}
              />
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
            <h3 className="font-display text-base font-bold flex items-center gap-2"><CalendarDays className="h-4 w-4 text-amber-400" /> Por día de la semana</h3>
            <p className="text-[10px] text-muted-foreground">Promedio por día (30d)</p>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weekdaySeries} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminGoldBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(45 80% 65%)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="hsl(45 80% 50%)" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "hsl(45 80% 70%)" }}
                  formatter={(v: number, _n, p) => [`${v} prom · ${p.payload.total} total`, "Visitas"]}
                />
                <Bar dataKey="promedio" fill="url(#adminGoldBar)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
