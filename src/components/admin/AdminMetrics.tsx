import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, BadgeCheck, Crown, Sparkles, TrendingUp } from "lucide-react";

interface Metrics {
  creatorsTotal: number;
  creatorsVerified: number;
  creatorsPending: number;
  visitorsTotal: number;
  activeSubs: number;
  newToday: number;
  revenueCents: number;
}

const initial: Metrics = {
  creatorsTotal: 0,
  creatorsVerified: 0,
  creatorsPending: 0,
  visitorsTotal: 0,
  activeSubs: 0,
  newToday: 0,
  revenueCents: 0,
};

export const AdminMetrics = () => {
  const [m, setM] = useState<Metrics>(initial);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [creators, verified, pending, visitors, subs, newProfiles, payments] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "creator"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_verified", true),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "visitor"),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["trial", "active"]).gt("expires_at", new Date().toISOString()),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", startOfDay.toISOString()),
        supabase.from("payments").select("amount_cents").eq("status", "APPROVED").gte("paid_at", startOfDay.toISOString()),
      ]);

      const revenue = (payments.data ?? []).reduce((acc: number, p: any) => acc + (p.amount_cents ?? 0), 0);

      setM({
        creatorsTotal: creators.count ?? 0,
        creatorsVerified: verified.count ?? 0,
        creatorsPending: pending.count ?? 0,
        visitorsTotal: visitors.count ?? 0,
        activeSubs: subs.count ?? 0,
        newToday: newProfiles.count ?? 0,
        revenueCents: revenue,
      });
      setLoading(false);
    })();
  }, []);

  const cards = [
    {
      label: "Creadores",
      value: m.creatorsTotal,
      sub: `${m.creatorsVerified} verificados · ${m.creatorsPending} pendientes`,
      icon: Sparkles,
      gradient: "from-primary to-primary-glow",
    },
    {
      label: "Clientes",
      value: m.visitorsTotal,
      sub: "Usuarios registrados",
      icon: Users,
      gradient: "from-fuchsia-500 to-purple-600",
    },
    {
      label: "Suscripciones activas",
      value: m.activeSubs,
      sub: `Ingresos hoy: $${(m.revenueCents / 100).toLocaleString("es-CO")}`,
      icon: Crown,
      gradient: "from-amber-400 to-yellow-600",
    },
    {
      label: "Nuevos hoy",
      value: m.newToday,
      sub: "Registros últimas 24h",
      icon: TrendingUp,
      gradient: "from-emerald-400 to-teal-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="card-glass card-lift rounded-2xl p-5 relative overflow-hidden group"
          >
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${c.gradient} opacity-20 blur-2xl group-hover:opacity-40 transition`} />
            <div className="flex items-center justify-between mb-3">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.gradient} text-white shadow-glow-soft`}>
                <Icon className="h-5 w-5" />
              </span>
              <BadgeCheck className="h-4 w-4 text-muted-foreground/30" />
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="font-display text-3xl font-extrabold tracking-tight mt-1">
              {loading ? "—" : c.value.toLocaleString("es-CO")}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{c.sub}</p>
          </div>
        );
      })}
    </div>
  );
};
