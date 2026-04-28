import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, User, Crown } from "lucide-react";

interface Row {
  id: string;
  display_name: string | null;
  city: string | null;
  account_type: string;
  created_at: string;
  is_verified: boolean;
}

export const AdminUsers = ({ filter }: { filter: "visitor" | "creator" | "all" }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase
        .from("profiles")
        .select("id,display_name,city,account_type,created_at,is_verified")
        .order("created_at", { ascending: false })
        .limit(300);
      if (filter !== "all") query = query.eq("account_type", filter);
      const { data } = await query;
      setRows((data as any) ?? []);
      setLoading(false);
    })();
  }, [filter]);

  const filtered = rows.filter((r) =>
    !q.trim() ||
    r.display_name?.toLowerCase().includes(q.toLowerCase()) ||
    r.city?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="card-glass rounded-2xl p-4 flex items-center gap-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o ciudad…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} usuarios</span>
      </div>

      <div className="card-glass rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Sin resultados.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {filtered.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-3 sm:p-4 hover:bg-secondary/30">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                  r.account_type === "creator" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  {r.account_type === "creator" ? <Crown className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {r.display_name ?? "Sin nombre"}
                    {r.is_verified && <span className="ml-2 text-xs text-success">✓</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.account_type === "creator" ? "Creador" : "Cliente"} · {r.city ?? "—"} · Desde {new Date(r.created_at).toLocaleDateString("es-CO")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
