import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Search, ExternalLink, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Row {
  id: string;
  user_number: number;
  display_name: string | null;
  city: string | null;
  is_verified: boolean;
  view_count: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  photos: string[] | null;
}

export const AdminProfiles = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id,user_number,display_name,city,is_verified,view_count,rating_avg,rating_count,created_at,photos")
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      r.display_name?.toLowerCase().includes(s) ||
      r.city?.toLowerCase().includes(s) ||
      String(r.user_number).includes(s)
    );
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar el perfil de "${name}"? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) {
      toast.error("No se pudo eliminar", { description: error.message });
    } else {
      toast.success("Perfil eliminado");
      setRows((r) => r.filter((x) => x.id !== id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="card-glass rounded-2xl p-4 flex items-center gap-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, ciudad o #ID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} perfiles</span>
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
                <div className="h-12 w-12 rounded-full bg-secondary overflow-hidden shrink-0">
                  {r.photos?.[0] && (
                    <img src={r.photos[0]} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold truncate">
                    {r.display_name ?? "Sin nombre"}{" "}
                    <span className="text-xs text-muted-foreground font-normal">#{r.user_number}</span>
                    {r.is_verified && <span className="ml-2 text-xs text-success">✓</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.city ?? "—"} · {r.view_count} vistas · ⭐ {Number(r.rating_avg).toFixed(1)} ({r.rating_count})
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Link to={`/perfil/${r.id}`} target="_blank">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(r.id, r.display_name ?? "perfil")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
