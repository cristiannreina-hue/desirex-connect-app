import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Row {
  id: string;
  user_number: number;
  display_name: string | null;
  verification_status: string;
  verification_id_url: string | null;
  verification_selfie_url: string | null;
  verification_selfie_face_url: string | null;
  verification_selfie_id_url: string | null;
  verification_submitted_at: string | null;
}

export const AdminVerifications = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id,user_number,display_name,verification_status,verification_id_url,verification_selfie_url,verification_selfie_face_url,verification_selfie_id_url,verification_submitted_at")
      .eq("verification_status", "pending")
      .order("verification_submitted_at", { ascending: true });
    setRows((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    const { error } = await supabase.rpc("approve_verification_and_purge" as any, { _user_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success("Verificación aprobada · selfies eliminadas");
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const reject = async (id: string) => {
    const { error } = await supabase.rpc("reject_verification" as any, { _user_id: id, _reason: null });
    if (error) { toast.error(error.message); return; }
    toast.success("Verificación rechazada");
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const signed = async (path: string | null) => {
    if (!path) return null;
    const { data } = await supabase.storage.from("verification-docs").createSignedUrl(path, 60);
    return data?.signedUrl ?? null;
  };

  if (loading) return <p className="p-6 text-center text-sm text-muted-foreground">Cargando…</p>;
  if (rows.length === 0) {
    return (
      <div className="card-glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
        No hay verificaciones pendientes ✨
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <VerificationCard key={r.id} row={r} onApprove={approve} onReject={reject} signed={signed} />
      ))}
    </div>
  );
};

const VerificationCard = ({
  row, onApprove, onReject, signed,
}: {
  row: Row;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  signed: (p: string | null) => Promise<string | null>;
}) => {
  const [faceUrl, setFaceUrl] = useState<string | null>(null);
  const [idSelfieUrl, setIdSelfieUrl] = useState<string | null>(null);
  const [legacyIdUrl, setLegacyIdUrl] = useState<string | null>(null);
  const [legacySelfieUrl, setLegacySelfieUrl] = useState<string | null>(null);

  useEffect(() => {
    signed(row.verification_selfie_face_url).then(setFaceUrl);
    signed(row.verification_selfie_id_url).then(setIdSelfieUrl);
    signed(row.verification_id_url).then(setLegacyIdUrl);
    signed(row.verification_selfie_url).then(setLegacySelfieUrl);
  }, [row.id]);

  const useLegacy = !row.verification_selfie_face_url && !row.verification_selfie_id_url;

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-display font-bold">
            {row.display_name ?? "Sin nombre"}{" "}
            <span className="text-xs text-muted-foreground font-normal">#{row.user_number}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Enviado {row.verification_submitted_at ? new Date(row.verification_submitted_at).toLocaleString("es-CO") : "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onReject(row.id)}>
            <X className="h-3.5 w-3.5" /> Rechazar
          </Button>
          <Button size="sm" variant="hero" className="gap-1.5" onClick={() => onApprove(row.id)}>
            <Check className="h-3.5 w-3.5" /> Aprobar y purgar
          </Button>
        </div>
      </div>
      {useLegacy ? (
        <div className="grid grid-cols-2 gap-3">
          <DocPreview label="Documento (legacy)" url={legacyIdUrl} />
          <DocPreview label="Selfie (legacy)" url={legacySelfieUrl} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <DocPreview label="Selfie 1 · Rostro" url={faceUrl} />
          <DocPreview label="Selfie 2 · Rostro + cédula" url={idSelfieUrl} />
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">
        Al aprobar, las imágenes se eliminan automáticamente del almacenamiento.
      </p>
    </div>
  );
};

const DocPreview = ({ label, url }: { label: string; url: string | null }) => (
  <div>
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    {url ? (
      <a href={url} target="_blank" rel="noreferrer" className="block aspect-video rounded-xl overflow-hidden bg-secondary group relative">
        <img src={url} alt={label} className="h-full w-full object-cover" />
        <span className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs gap-1">
          <ExternalLink className="h-3 w-3" /> Abrir
        </span>
      </a>
    ) : (
      <div className="aspect-video rounded-xl bg-secondary flex items-center justify-center text-xs text-muted-foreground">
        No disponible
      </div>
    )}
  </div>
);
