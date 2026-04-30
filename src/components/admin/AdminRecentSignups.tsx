import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Crown } from "lucide-react";

interface Row {
  id: string;
  display_name: string | null;
  account_type: string;
  created_at: string;
}

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

const List = ({
  title,
  icon: Icon,
  rows,
  loading,
  emptyText,
  accent,
}: {
  title: string;
  icon: any;
  rows: Row[];
  loading: boolean;
  emptyText: string;
  accent: "creator" | "visitor";
}) => (
  <div className="card-glass rounded-2xl p-5">
    <h3 className="font-display font-bold mb-3 flex items-center gap-2">
      <Icon className={`h-4 w-4 ${accent === "creator" ? "text-primary" : "text-muted-foreground"}`} />
      {title}
      <span className="ml-auto text-xs text-muted-foreground">{rows.length}</span>
    </h3>
    {loading ? (
      <p className="p-4 text-center text-sm text-muted-foreground">Cargando…</p>
    ) : rows.length === 0 ? (
      <p className="p-4 text-center text-sm text-muted-foreground">{emptyText}</p>
    ) : (
      <ul className="divide-y divide-border/60">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2.5">
            <span
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                accent === "creator" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
              }`}
            >
              {accent === "creator" ? <Crown className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate text-sm">{r.display_name ?? "Sin nombre"}</p>
              <p className="text-xs text-muted-foreground">Se unió el {formatDate(r.created_at)}</p>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export const AdminRecentSignups = () => {
  const [visitors, setVisitors] = useState<Row[]>([]);
  const [creators, setCreators] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [v, c] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,display_name,account_type,created_at")
          .eq("account_type", "visitor")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("profiles")
          .select("id,display_name,account_type,created_at")
          .eq("account_type", "creator")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      setVisitors((v.data as any) ?? []);
      setCreators((c.data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <List
        title="Visitantes recientes"
        icon={User}
        rows={visitors}
        loading={loading}
        emptyText="Aún no hay visitantes."
        accent="visitor"
      />
      <List
        title="Creadores recientes"
        icon={Crown}
        rows={creators}
        loading={loading}
        emptyText="Aún no hay creadores."
        accent="creator"
      />
    </div>
  );
};
