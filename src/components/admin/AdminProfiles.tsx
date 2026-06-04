import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Search, Eye, EyeOff, Star, Pause, Play, Rocket, MessageCircle, MessageCircleOff } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface Row {
  id: string;
  user_number: number;
  display_name: string | null;
  city: string | null;
  category: string | null;
  is_verified: boolean;
  is_featured: boolean;
  is_suspended: boolean;
  is_public_visible: boolean;
  hide_whatsapp: boolean;

  view_count: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  photos: string[] | null;
}

const CITIES = ["Todas", "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Pereira"];
const CATEGORIES = ["Todas", "Escort", "Gigoló", "Trans"];

export const AdminProfiles = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("Todas");
  const [cat, setCat] = useState("Todas");
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmActivateAll, setConfirmActivateAll] = useState(false);


  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id,user_number,display_name,city,category,is_verified,is_featured,is_suspended,is_public_visible,hide_whatsapp,view_count,rating_avg,rating_count,created_at,photos")
      .order("created_at", { ascending: false })
      .limit(300);
    setRows((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (q.trim()) {
      const s = q.toLowerCase();
      if (
        !(r.display_name?.toLowerCase().includes(s) ||
          r.city?.toLowerCase().includes(s) ||
          String(r.user_number).includes(s))
      ) return false;
    }
    if (city !== "Todas" && r.city?.toLowerCase() !== city.toLowerCase()) return false;
    if (cat !== "Todas" && r.category?.toLowerCase() !== cat.toLowerCase()) return false;
    return true;
  });

  const toggleFlag = async (id: string, field: "is_featured" | "is_suspended" | "is_public_visible" | "hide_whatsapp", current: boolean) => {
    const { error } = await supabase.from("profiles").update({ [field]: !current } as any).eq("id", id);
    if (error) return toast.error(error.message);
    const labels: Record<typeof field, [string, string]> = {
      is_featured: ["Destacado en Home", "Removido de Home"],
      is_suspended: ["Perfil suspendido", "Perfil reactivado"],
      is_public_visible: ["Perfil activado (visible)", "Perfil ocultado"],
      hide_whatsapp: ["WhatsApp ocultado", "WhatsApp visible"],
    };

    toast.success(!current ? labels[field][0] : labels[field][1]);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: !current } : r)));
  };

  const activateAll = async () => {
    const hidden = filtered.filter((r) => !r.is_public_visible);
    if (hidden.length === 0) {
      toast.info("Todos los perfiles ya están visibles");
      return;
    }
    const ids = hidden.map((r) => r.id);
    const { error } = await supabase.from("profiles").update({ is_public_visible: true } as any).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} perfil(es) activados`);
    setRows((rs) => rs.map((r) => (ids.includes(r.id) ? { ...r, is_public_visible: true } : r)));
  };

  const doDelete = async (id: string, name: string) => {
    // Optimista: quitar de la lista
    setRows((r) => r.filter((x) => x.id !== id));
    const { data, error } = await supabase.functions.invoke("admin-delete-user", {
      body: { target_user_id: id },
    });
    if (error || (data as any)?.error) {
      toast.error("No se pudo eliminar", { description: error?.message || (data as any)?.error });
      await load();
      return;
    }
    toast.success(`Cuenta de "${name}" eliminada`);
    await load();
  };


  return (
    <div className="space-y-4">
      <div className="card-glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nombre, ciudad o #ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CITIES.map((c) => (
            <button
              key={c}
              onClick={() => setCity(c)}
              className={`text-xs px-3 py-1.5 rounded-full transition ${
                city === c ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`text-xs px-3 py-1.5 rounded-full transition ${
                cat === c ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <Button onClick={() => setConfirmActivateAll(true)} size="sm" variant="outline" className="gap-2">
          <Rocket className="h-4 w-4" /> Activar todos
        </Button>
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
              <li key={r.id} className={`flex items-center gap-3 p-3 sm:p-4 hover:bg-secondary/30 transition ${r.is_suspended ? "opacity-60" : ""}`}>
                <div className="h-12 w-12 rounded-full bg-secondary overflow-hidden shrink-0 ring-2 ring-transparent" style={r.is_featured ? { boxShadow: "0 0 0 2px hsl(var(--primary))" } : undefined}>
                  {r.photos?.[0] && <img src={r.photos[0]} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold truncate flex items-center gap-1.5">
                    {r.display_name ?? "Sin nombre"}
                    <span className="text-xs text-muted-foreground font-normal">#{r.user_number}</span>
                    {r.is_verified && <span className="text-xs text-success">✓</span>}
                    {r.is_featured && <Star className="h-3 w-3 fill-primary text-primary" />}
                    {!r.is_public_visible && <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Oculto</span>}
                    {r.is_suspended && <span className="text-[10px] uppercase tracking-wider text-destructive font-bold">Suspendido</span>}
                    {r.hide_whatsapp && <span className="text-[10px] uppercase tracking-wider text-destructive font-bold">Sin WhatsApp</span>}

                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.category ?? "—"} · {r.city ?? "—"} · {r.view_count} vistas · ⭐ {Number(r.rating_avg).toFixed(1)} ({r.rating_count})
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 ${r.is_public_visible ? "text-success" : "text-amber-400"}`}
                    title={r.is_public_visible ? "Ocultar perfil del público" : "Activar visibilidad pública"}
                    onClick={() => toggleFlag(r.id, "is_public_visible", r.is_public_visible)}
                  >
                    {r.is_public_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 ${r.is_featured ? "text-primary" : ""}`}
                    title={r.is_featured ? "Quitar de destacados" : "Destacar en Home"}
                    onClick={() => toggleFlag(r.id, "is_featured", r.is_featured)}
                  >
                    <Star className={`h-4 w-4 ${r.is_featured ? "fill-primary" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title={r.is_suspended ? "Reactivar" : "Suspender"}
                    onClick={() => toggleFlag(r.id, "is_suspended", r.is_suspended)}
                  >
                    {r.is_suspended ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Link to={`/perfil/${r.id}`} target="_blank">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => setConfirmDelete({ id: r.id, name: r.display_name ?? "perfil" })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrará el perfil de <strong>{confirmDelete?.name}</strong> y su usuario por completo. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDelete) doDelete(confirmDelete.id, confirmDelete.name);
                setConfirmDelete(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmActivateAll} onOpenChange={setConfirmActivateAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Activar todos los perfiles ocultos?</AlertDialogTitle>
            <AlertDialogDescription>
              Se hará visible al público todos los perfiles ocultos que coinciden con los filtros actuales.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { activateAll(); setConfirmActivateAll(false); }}>
              Activar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

