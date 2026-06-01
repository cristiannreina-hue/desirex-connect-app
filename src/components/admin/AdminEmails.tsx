import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Mail, Search, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface LogRow {
  id: string;
  recipient_email: string;
  template_name: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface SuppRow {
  id: string;
  email: string;
  reason: string;
  created_at: string;
}

export const AdminEmails = () => {
  const [tab, setTab] = useState<"log" | "suppressed">("log");
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [supp, setSupp] = useState<SuppRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [l, s] = await Promise.all([
        supabase.from("email_send_log").select("id,recipient_email,template_name,status,error_message,created_at").order("created_at", { ascending: false }).limit(300),
        supabase.from("suppressed_emails").select("id,email,reason,created_at").order("created_at", { ascending: false }).limit(300),
      ]);
      setLogs((l.data as any) ?? []);
      setSupp((s.data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  const filteredLogs = logs.filter((r) =>
    !q.trim() || r.recipient_email.toLowerCase().includes(q.toLowerCase()) || r.template_name.toLowerCase().includes(q.toLowerCase())
  );
  const filteredSupp = supp.filter((r) =>
    !q.trim() || r.email.toLowerCase().includes(q.toLowerCase()) || r.reason.toLowerCase().includes(q.toLowerCase())
  );

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "sent" || status === "ok") return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (status === "failed" || status === "error") return <XCircle className="h-4 w-4 text-destructive" />;
    return <AlertTriangle className="h-4 w-4 text-amber-400" />;
  };

  return (
    <div className="space-y-4">
      <div className="card-glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          <button
            onClick={() => setTab("log")}
            className={`text-xs px-3 py-1.5 rounded-full transition ${tab === "log" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}
          >
            Enviados ({logs.length})
          </button>
          <button
            onClick={() => setTab("suppressed")}
            className={`text-xs px-3 py-1.5 rounded-full transition ${tab === "suppressed" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}
          >
            Suprimidos ({supp.length})
          </button>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar email o plantilla…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="card-glass rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : tab === "log" ? (
          filteredLogs.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Sin envíos registrados.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {filteredLogs.map((r) => (
                <li key={r.id} className="flex items-start gap-3 p-4">
                  <StatusIcon status={r.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {r.recipient_email} <span className="text-muted-foreground font-normal">· {r.template_name}</span>
                    </p>
                    {r.error_message && <p className="text-xs text-destructive mt-0.5 break-words">{r.error_message}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString("es-CO")} · {r.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : filteredSupp.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Sin emails suprimidos.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {filteredSupp.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-4">
                <Mail className="h-4 w-4 text-destructive" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.email}</p>
                  <p className="text-xs text-muted-foreground">{r.reason} · {new Date(r.created_at).toLocaleString("es-CO")}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
