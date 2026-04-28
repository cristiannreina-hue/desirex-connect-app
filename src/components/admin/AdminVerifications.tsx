import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, X, ExternalLink, Shield, Trash2, Radio } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Row {
  id: string;
  user_id: string;
  display_name: string | null;
  user_number: number | null;
  photo_url_id: string;
  photo_url_selfie: string;
  status: string;
  created_at: string;
}

export const AdminVerifications = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.rpc("list_pending_verifications" as any);
    if (error) {
      toast.error(error.message);
      setRows([]);
    } else {
      setRows((data as any) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Suscripción Realtime: refresca al insertar/actualizar/borrar solicitudes
    const channel = supabase
      .channel("admin-verifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "verification_requests" },
        (payload) => {
          load();
          if (payload.eventType === "INSERT") {
            toast.info("📥 Nueva solicitud de verificación recibida");
          }
        }
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => { supabase.removeChannel(channel); };
  }, []);

  const approve = async (id: string) => {
    const { error } = await supabase.rpc("approve_verification_request" as any, { _request_id: id });
    if (error) return toast.error(error.message);
    toast.success("✓ Verificación aprobada · sello dorado activado · documentos purgados");
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const reject = async (id: string, reason: string) => {
    const { error } = await supabase.rpc("reject_verification_request" as any, { _request_id: id, _reason: reason || null });
    if (error) return toast.error(error.message);
    toast.success("Verificación rechazada");
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const signed = async (path: string | null) => {
    if (!path) return null;
    const { data } = await supabase.storage.from("verification-docs").createSignedUrl(path, 60);
    return data?.signedUrl ?? null;
  };

  if (loading) return <p className="p-6 text-center text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div className="space-y-4">
      <div className="card-glass rounded-2xl p-4 flex items-center gap-3">
        <Shield className="h-4 w-4 text-amber-400" />
        <div className="flex-1">
          <p className="text-sm font-semibold">{rows.length} solicitudes pendientes</p>
          <p className="text-xs text-muted-foreground">Compara las dos selfies y aprueba para activar el sello dorado.</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full ${
          live ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
               : "bg-muted text-muted-foreground"
        }`}>
          <Radio className={`h-3 w-3 ${live ? "animate-pulse" : ""}`} />
          {live ? "En vivo" : "Conectando…"}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="card-glass rounded-2xl p-10 text-center">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No hay verificaciones pendientes ✨</p>
        </div>
      ) : (
        rows.map((r) => (
          <VerificationCard key={r.id} row={r} onApprove={approve} onReject={reject} signed={signed} />
        ))
      )}
    </div>
  );
};

const QUICK_REASONS = [
  "Foto borrosa",
  "Documento ilegible",
  "Rostro no coincide",
  "Falta selfie con cédula",
];

const VerificationCard = ({
  row, onApprove, onReject, signed,
}: {
  row: Row;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  signed: (p: string | null) => Promise<string | null>;
}) => {
  const [faceUrl, setFaceUrl] = useState<string | null>(null);
  const [idSelfieUrl, setIdSelfieUrl] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    signed(row.photo_url_selfie).then(setFaceUrl);
    signed(row.photo_url_id).then(setIdSelfieUrl);
  }, [row.id]);

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-display font-bold text-lg">
            {row.display_name ?? "Sin nombre"}{" "}
            {row.user_number != null && (
              <span className="text-xs text-muted-foreground font-normal">#{row.user_number}</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            Enviado {new Date(row.created_at).toLocaleString("es-CO")}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <X className="h-3.5 w-3.5" /> Rechazar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Motivo del rechazo</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REASONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => setReason(q)}
                      className={`text-xs px-3 py-1.5 rounded-full transition ${
                        reason === q ? "bg-primary text-primary-foreground" : "bg-secondary/50 hover:bg-secondary"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Mensaje opcional para el creador…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    onReject(row.id, reason);
                    setOpen(false);
                  }}
                >
                  Rechazar verificación
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button size="sm" variant="hero" className="gap-1.5" onClick={() => onApprove(row.id)}>
            <Check className="h-3.5 w-3.5" /> Aprobar y purgar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
        <DocPreview label="① Rostro (selfie)" url={faceUrl} accent />
        <DocPreview label="② Rostro + cédula" url={idSelfieUrl} accent />
        <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-background border border-border shadow-glow-soft">
          <span className="text-xs font-bold">VS</span>
        </div>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Trash2 className="h-3 w-3" />
        Al aprobar, las imágenes se eliminan automáticamente del servidor (cumplimiento de protección de datos).
      </p>
    </div>
  );
};

const DocPreview = ({ label, url, accent }: { label: string; url: string | null; accent?: boolean }) => (
  <div>
    <p className={`text-xs mb-1.5 font-semibold ${accent ? "text-primary" : "text-muted-foreground"}`}>{label}</p>
    {url ? (
      <a href={url} target="_blank" rel="noreferrer" className="block aspect-[4/5] rounded-xl overflow-hidden bg-secondary group relative ring-1 ring-border/60 hover:ring-primary transition">
        <img src={url} alt={label} className="h-full w-full object-cover" />
        <span className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs gap-1 backdrop-blur-sm">
          <ExternalLink className="h-3 w-3" /> Ampliar
        </span>
      </a>
    ) : (
      <div className="aspect-[4/5] rounded-xl bg-secondary flex items-center justify-center text-xs text-muted-foreground">
        No disponible
      </div>
    )}
  </div>
);
