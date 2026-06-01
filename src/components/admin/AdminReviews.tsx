import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Row {
  id: string;
  profile_id: string;
  author_id: string;
  stars: number;
  comment: string | null;
  created_at: string;
  profile?: { display_name: string | null; user_number: number } | null;
  author?: { display_name: string | null; user_number: number } | null;
}

export const AdminReviews = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("id,profile_id,author_id,stars,comment,created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    const list = (data as any[]) ?? [];
    // Hydrate names
    const ids = Array.from(new Set(list.flatMap((r) => [r.profile_id, r.author_id])));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,display_name,user_number")
        .in("id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      list.forEach((r) => {
        r.profile = map.get(r.profile_id) ?? null;
        r.author = map.get(r.author_id) ?? null;
      });
    }
    setRows(list as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      r.comment?.toLowerCase().includes(s) ||
      r.profile?.display_name?.toLowerCase().includes(s) ||
      r.author?.display_name?.toLowerCase().includes(s)
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta reseña? No se puede deshacer.")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Reseña eliminada");
    setRows((r) => r.filter((x) => x.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="card-glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por comentario, perfil o autor…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0"
          />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} reseñas</span>
      </div>

      <div className="card-glass rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Sin reseñas.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {filtered.map((r) => (
              <li key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-start gap-3 hover:bg-secondary/30 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-display font-bold">
                      {r.author?.display_name ?? "Anónimo"}
                      {r.author && <span className="text-muted-foreground font-normal"> #{r.author.user_number}</span>}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <Link to={`/perfil/${r.profile_id}`} target="_blank" className="text-primary hover:underline">
                      {r.profile?.display_name ?? "perfil"}
                      {r.profile && <span className="text-muted-foreground"> #{r.profile.user_number}</span>}
                    </Link>
                    <span className="ml-2 inline-flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: r.stars }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-400" />
                      ))}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground mt-1 break-words">{r.comment}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString("es-CO")}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive shrink-0"
                  onClick={() => handleDelete(r.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
