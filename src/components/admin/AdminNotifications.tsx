import { useEffect, useState } from "react";
import { Bell, BadgeCheck, UserPlus, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

type Notif = {
  id: string;
  kind: "verification" | "signup" | "premium";
  title: string;
  subtitle: string;
  at: string;
};

export const AdminNotifications = () => {
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);

  // Initial fetch
  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const [pendings, signups, premiums] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,display_name,verification_submitted_at")
          .eq("verification_status", "pending")
          .gte("verification_submitted_at", since)
          .order("verification_submitted_at", { ascending: false })
          .limit(10),
        supabase
          .from("profiles")
          .select("id,display_name,created_at,account_type")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("subscriptions")
          .select("id,user_id,tier,started_at")
          .neq("tier", "starter")
          .gte("started_at", since)
          .order("started_at", { ascending: false })
          .limit(10),
      ]);

      const list: Notif[] = [];
      pendings.data?.forEach((r: any) =>
        list.push({
          id: `v-${r.id}`,
          kind: "verification" as const,
          title: r.display_name ?? "Sin nombre",
          subtitle: "Subió documentos para verificar",
          at: r.verification_submitted_at,
        })
      );
      signups.data?.forEach((r: any) =>
        list.push({
          id: `s-${r.id}`,
          kind: "signup" as const,
          title: r.display_name ?? "Nuevo usuario",
          subtitle: r.account_type === "creator" ? "Nuevo creador" : "Nuevo cliente",
          at: r.created_at,
        })
      );
      premiums.data?.forEach((r: any) =>
        list.push({
          id: `p-${r.id}`,
          kind: "premium" as const,
          title: `Plan ${r.tier}`,
          subtitle: "Suscripción premium activada",
          at: r.started_at,
        })
      );

      list.sort((a, b) => +new Date(b.at) - +new Date(a.at));
      setItems(list.slice(0, 20));
      setUnread(list.length);
    })();
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    const chan = supabase
      .channel("admin-notifs")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: "verification_status=eq.pending" },
        (p: any) => {
          setItems((prev) => [
            {
              id: `v-${p.new.id}-${Date.now()}`,
              kind: "verification" as const,
              title: p.new.display_name ?? "Sin nombre",
              subtitle: "Subió documentos para verificar",
              at: p.new.verification_submitted_at ?? new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 20));
          setUnread((u) => u + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        (p: any) => {
          setItems((prev) => [
            {
              id: `s-${p.new.id}-${Date.now()}`,
              kind: "signup" as const,
              title: p.new.display_name ?? "Nuevo usuario",
              subtitle: p.new.account_type === "creator" ? "Nuevo creador" : "Nuevo cliente",
              at: p.new.created_at ?? new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 20));
          setUnread((u) => u + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "subscriptions" },
        (p: any) => {
          if (p.new.tier === "starter") return;
          setItems((prev) => [
            {
              id: `p-${p.new.id}-${Date.now()}`,
              kind: "premium" as const,
              title: `Plan ${p.new.tier}`,
              subtitle: "Suscripción premium activada",
              at: p.new.started_at ?? new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 20));
          setUnread((u) => u + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chan);
    };
  }, []);

  const iconFor = (k: Notif["kind"]) => {
    if (k === "verification") return BadgeCheck;
    if (k === "premium") return Crown;
    return UserPlus;
  };

  return (
    <Popover onOpenChange={(o) => o && setUnread(0)}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 inline-flex h-4 min-w-[1rem] px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border/60 p-3">
          <p className="font-display font-bold text-sm">Notificaciones</p>
          <p className="text-[11px] text-muted-foreground">Actividad reciente en tiempo real</p>
        </div>
        <div className="max-h-96 overflow-auto">
          {items.length === 0 ? (
            <p className="p-6 text-center text-xs text-muted-foreground">Sin actividad reciente.</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {items.map((n) => {
                const Icon = iconFor(n.kind);
                return (
                  <li key={n.id} className="flex items-start gap-3 p-3 hover:bg-secondary/30 transition">
                    <span className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                      n.kind === "verification" ? "bg-amber-500/20 text-amber-400" :
                      n.kind === "premium" ? "bg-primary/20 text-primary" :
                      "bg-emerald-500/20 text-emerald-400"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{n.subtitle}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        {new Date(n.at).toLocaleString("es-CO")}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
