import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Crown } from "lucide-react";
import { TIER_BADGE, daysRemaining } from "@/lib/tier";
import { TIER_LABELS, type Tier } from "@/types/profile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  user_id: string;
  tier: Tier;
  status: string;
  expires_at: string;
  display_name?: string | null;
  user_number?: number | null;
}

export const AdminSubscriptions = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("id,user_id,tier,status,expires_at")
      .order("expires_at", { ascending: false })
      .limit(200);
    if (!subs) { setLoading(false); return; }

    const ids = subs.map((s) => s.user_id);
    const { data: profs } = await supabase
      .from("profiles")
      .select("id,display_name,user_number")
      .in("id", ids);
    const map = new Map((profs ?? []).map((p) => [p.id, p]));

    setRows(subs.map((s: any) => ({ ...s, display_name: map.get(s.user_id)?.display_name, user_number: map.get(s.user_id)?.user_number })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return r.display_name?.toLowerCase().includes(s) || String(r.user_number).includes(s);
  });

  const changeTier = async (id: string, tier: Tier) => {
    const { error } = await supabase.from("subscriptions").update({ tier, status: "active" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Plan actualizado");
    setRows((r) => r.map((x) => (x.id === id ? { ...x, tier, status: "active" } : x)));
  };

  const extendDays = async (row: Row, days: number) => {
    const base = new Date(Math.max(new Date(row.expires_at).getTime(), Date.now()));
    base.setDate(base.getDate() + days);
    const { error } = await supabase
      .from("subscriptions")
      .update({ expires_at: base.toISOString(), status: "active" })
      .eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`+${days} días añadidos`);
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, expires_at: base.toISOString(), status: "active" } : x)));
  };

  return (
    <div className="space-y-4">
      <div className="card-glass rounded-2xl p-4 flex items-center gap-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o #ID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length}</span>
      </div>

      <div className="card-glass rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {filtered.map((r) => {
              const days = daysRemaining(r.expires_at);
              const badge = TIER_BADGE[r.tier];
              return (
                <li key={r.id} className="p-4 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-display font-bold">
                      {r.display_name ?? "—"}{" "}
                      <span className="text-xs text-muted-foreground font-normal">#{r.user_number}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.status} · expira en{" "}
                      <span className={cn(days <= 7 ? "text-warning" : "text-success")}>{days} días</span>
                    </p>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", badge.className)}>
                    {badge.emoji} {badge.label}
                  </span>
                  <Select value={r.tier} onValueChange={(v) => changeTier(r.id, v as Tier)}>
                    <SelectTrigger className="h-8 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TIER_LABELS) as Tier[]).map((t) => (
                        <SelectItem key={t} value={t}>{TIER_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={() => extendDays(r, 30)}>+30d</Button>
                  <Button size="sm" variant="outline" onClick={() => extendDays(r, 7)}>+7d</Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
