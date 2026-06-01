import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle2, XCircle, Clock } from "lucide-react";

interface Row {
  id: string;
  event_type: string | null;
  event_id: string | null;
  reference: string | null;
  processed: boolean;
  error: string | null;
  created_at: string;
}

export const AdminWompiEvents = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [expand, setExpand] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("wompi_events")
        .select("id,event_type,event_id,reference,processed,error,created_at")
        .order("created_at", { ascending: false })
        .limit(300);
      setRows((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) =>
    !q.trim() ||
    r.event_type?.toLowerCase().includes(q.toLowerCase()) ||
    r.reference?.toLowerCase().includes(q.toLowerCase()) ||
    r.event_id?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="card-glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por evento o referencia…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0"
          />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} eventos</span>
      </div>

      <div className="card-glass rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Sin eventos del proveedor de pagos.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {filtered.map((r) => (
              <li key={r.id} className="p-4">
                <button
                  className="w-full flex items-center gap-3 text-left"
                  onClick={() => setExpand(expand === r.id ? null : r.id)}
                >
                  {r.error ? (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  ) : r.processed ? (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {r.event_type ?? "—"} <span className="text-muted-foreground font-normal">· ref {r.reference ?? "—"}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString("es-CO")} · {r.event_id ?? "sin id"}</p>
                  </div>
                </button>
                {expand === r.id && r.error && (
                  <pre className="mt-2 text-xs text-destructive bg-destructive/5 rounded p-2 overflow-auto">{r.error}</pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
