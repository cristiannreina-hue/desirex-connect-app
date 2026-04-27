import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  user_id: string;
  week_start: string;
  position: number;
  days_awarded: number;
  bonus_month: boolean;
  display_name?: string | null;
  user_number?: number | null;
}

export const AdminRewards = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: rewards } = await supabase
        .from("weekly_rewards")
        .select("*")
        .order("week_start", { ascending: false })
        .limit(60);
      if (!rewards) { setLoading(false); return; }
      const ids = [...new Set(rewards.map((r) => r.user_id))];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,display_name,user_number")
        .in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      setRows(rewards.map((r: any) => ({ ...r, display_name: map.get(r.user_id)?.display_name, user_number: map.get(r.user_id)?.user_number })));
      setLoading(false);
    })();
  }, []);

  const grouped = rows.reduce<Record<string, Row[]>>((acc, r) => {
    (acc[r.week_start] ||= []).push(r);
    return acc;
  }, {});

  const medal = (pos: number) => (pos === 1 ? "🥇" : pos === 2 ? "🥈" : "🥉");

  return (
    <div className="space-y-4">
      <div className="card-glass rounded-2xl p-5 flex items-start gap-3">
        <Trophy className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <div>
          <p className="font-display font-bold">Recompensas semanales automáticas</p>
          <p className="text-sm text-muted-foreground">
            Cada lunes a las 03:00 UTC el sistema premia el Top 3 de perfiles más populares de la semana
            con días gratis (+7 / +5 / +3). Quien gane 3 semanas seguidas recibe 1 mes extra.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="p-6 text-center text-sm text-muted-foreground">Cargando…</p>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card-glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
          Aún no se ha entregado ningún premio. La primera ronda se calculará el próximo lunes.
        </div>
      ) : (
        Object.entries(grouped).map(([week, list]) => (
          <div key={week} className="card-glass rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60 text-sm font-semibold">
              Semana del {new Date(week).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
            </div>
            <ul className="divide-y divide-border/60">
              {list.sort((a, b) => a.position - b.position).map((r) => (
                <li key={r.id} className="p-4 flex items-center gap-3">
                  <span className="text-xl">{medal(r.position)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold truncate">
                      {r.display_name ?? "—"}{" "}
                      <span className="text-xs text-muted-foreground font-normal">#{r.user_number}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">+{r.days_awarded} días gratis</p>
                  </div>
                  {r.bonus_month && (
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-primary text-primary-foreground")}>
                      <Gift className="h-3 w-3" /> +1 MES
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};
