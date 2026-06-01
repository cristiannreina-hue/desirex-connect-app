import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Mail, Phone, Download } from "lucide-react";
import { toast } from "sonner";

interface Row {
  id: string;
  contact: string;
  contact_type: string;
  source: string | null;
  created_at: string;
}

export const AdminLeads = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("leads_lanzamiento")
      .select("id,contact,contact_type,source,created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    setRows((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) =>
    !q.trim() || r.contact.toLowerCase().includes(q.toLowerCase()) || r.source?.toLowerCase().includes(q.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este lead?")) return;
    const { error } = await supabase.from("leads_lanzamiento").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success("Lead eliminado");
  };

  const exportCsv = () => {
    const header = "fecha,tipo,contacto,origen\n";
    const body = filtered
      .map((r) => `${new Date(r.created_at).toISOString()},${r.contact_type},${r.contact},${r.source ?? ""}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-lanzamiento-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="card-glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contacto u origen…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0"
          />
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
        <span className="text-xs text-muted-foreground">{filtered.length} leads</span>
      </div>

      <div className="card-glass rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Sin leads.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {filtered.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-4 hover:bg-secondary/30 transition">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary">
                  {r.contact_type === "email" ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.contact}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.source ?? "—"} · {new Date(r.created_at).toLocaleString("es-CO")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
