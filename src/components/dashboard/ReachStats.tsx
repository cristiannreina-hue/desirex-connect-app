import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, MousePointerClick, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewRow { viewer_id: string | null; viewer_fingerprint: string | null }

interface Props { profileId: string }

const DAYS = 30;

export const ReachStats = ({ profileId }: Props) => {
  const [views, setViews] = useState<ViewRow[]>([]);
  const [clicks, setClicks] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;
    const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();
    setLoading(true);
    Promise.all([
      supabase.from("profile_views").select("viewer_id, viewer_fingerprint").eq("profile_id", profileId).gte("created_at", since),
      supabase.from("profile_contact_clicks").select("id", { count: "exact", head: true }).eq("profile_id", profileId).gte("created_at", since),
    ]).then(([v, c]) => {
      setViews((v.data ?? []) as ViewRow[]);
      setClicks(c.count ?? 0);
      setLoading(false);
    });
  }, [profileId]);

  const stats = useMemo(() => {
    const totalViews = views.length;
    const uniqueIds = new Set<string>();
    views.forEach((v) => uniqueIds.add(v.viewer_id ?? `fp:${v.viewer_fingerprint ?? "anon"}`));
    return { totalViews, uniqueViews: uniqueIds.size, clicks };
  }, [views, clicks]);

  return (
    <section
      className={cn(
        "rounded-[28px] bg-black/80 backdrop-blur-xl border border-white/5",
        "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(212,175,55,0.08),inset_0_1px_0_rgba(255,255,255,0.04)]",
        "p-5 sm:p-6 space-y-4",
      )}
    >
      <header className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-400/40 text-amber-300">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-base font-bold text-white leading-tight">Estadísticas de Alcance</h2>
          <p className="text-[11px] text-white/40 leading-tight mt-0.5">Resumen de los últimos 30 días</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Kpi icon={<Eye className="h-4 w-4" />} label="Vistas totales" value={loading ? "—" : stats.totalViews.toLocaleString("es-CO")} />
        <Kpi icon={<Users className="h-4 w-4" />} label="Visitantes únicos" value={loading ? "—" : stats.uniqueViews.toLocaleString("es-CO")} />
        <Kpi icon={<MousePointerClick className="h-4 w-4" />} label="Clics en contacto" value={loading ? "—" : stats.clicks.toLocaleString("es-CO")} />
      </div>

      <p className="text-[11px] text-white/40 text-center pt-1">
        Mantén tu perfil activo y sube fotos nuevas para aumentar tu alcance ✨
      </p>
    </section>
  );
};

const Kpi = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-2xl border border-amber-400/15 bg-gradient-to-br from-amber-500/[0.06] to-black/60 p-4">
    <div className="flex items-center gap-2 text-amber-300">
      {icon}
      <span className="text-[10px] uppercase tracking-wider font-bold text-white/50">{label}</span>
    </div>
    <p className="font-display text-2xl font-extrabold text-white mt-2">{value}</p>
  </div>
);
