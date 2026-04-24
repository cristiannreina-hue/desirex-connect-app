import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, IdCard, Camera, BadgeCheck, Clock, ArrowRight, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const STEPS = [
  { icon: <IdCard className="h-5 w-5" />, title: "Sube tu documento", desc: "Cédula, pasaporte o cualquier ID oficial. Solo nuestro equipo lo verá." },
  { icon: <Camera className="h-5 w-5" />, title: "Selfie con seña", desc: "Una foto sosteniendo un papel con la palabra DeseoX y la fecha de hoy." },
  { icon: <Clock className="h-5 w-5" />, title: "Revisión 24-48 h", desc: "Nuestro equipo verifica que coincidan los datos y la edad." },
  { icon: <BadgeCheck className="h-5 w-5" />, title: "Insignia ✓ Verificado", desc: "Aparecerás como perfil verificado en toda la plataforma." },
];

const Verificacion = () => {
  const { user, loading: authLoading } = useAuth();
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string>("unverified");

  useEffect(() => { document.title = "Verificación · DeseoX"; }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("verification_status")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => data && setStatus(data.verification_status));
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !idFile || !selfieFile) return;
    setSubmitting(true);
    try {
      const idPath = `${user.id}/id-${Date.now()}-${idFile.name}`;
      const selfiePath = `${user.id}/selfie-${Date.now()}-${selfieFile.name}`;

      const [idUp, selUp] = await Promise.all([
        supabase.storage.from("verification-docs").upload(idPath, idFile, { upsert: true }),
        supabase.storage.from("verification-docs").upload(selfiePath, selfieFile, { upsert: true }),
      ]);
      if (idUp.error) throw idUp.error;
      if (selUp.error) throw selUp.error;

      const { error } = await supabase
        .from("profiles")
        .update({
          verification_status: "pending",
          verification_submitted_at: new Date().toISOString(),
          verification_id_url: idPath,
          verification_selfie_url: selfiePath,
        })
        .eq("id", user.id);
      if (error) throw error;

      setStatus("pending");
      toast({ title: "¡Solicitud enviada!", description: "Te avisaremos cuando esté lista (24-48h)." });
      setIdFile(null);
      setSelfieFile(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container flex-1 py-10 max-w-3xl mx-auto w-full space-y-10">
        {/* Hero */}
        <header className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-verified/15 ring-1 ring-verified/40 px-3 py-1 text-xs text-verified font-semibold mb-4">
            <ShieldCheck className="h-3.5 w-3.5" /> Programa oficial de verificación
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
            Insignia <span className="text-gradient">✓ Verificado</span> de DeseoX
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Generamos confianza verificando edad e identidad. Tus documentos solo
            son vistos por nuestro equipo y nunca son públicos.
          </p>
        </header>

        {/* Pasos */}
        <ol className="grid sm:grid-cols-2 gap-4">
          {STEPS.map((s, i) => (
            <li key={i} className="card-premium rounded-2xl p-5 flex gap-3">
              <div className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow-soft">
                {s.icon}
              </div>
              <div>
                <p className="font-display font-bold flex items-center gap-2">
                  <span className="text-xs text-accent">0{i + 1}</span>
                  {s.title}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* Privacidad */}
        <div className="card-glass rounded-2xl p-5 flex items-start gap-3">
          <Lock className="h-5 w-5 text-verified shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground leading-relaxed">
            <span className="text-foreground font-semibold">Tu privacidad primero.</span> Los archivos
            se guardan en un espacio privado y cifrado. Ni otros usuarios ni motores de
            búsqueda pueden acceder a ellos. Solo el equipo de revisión de DeseoX.
          </div>
        </div>

        {/* Formulario */}
        {authLoading ? null : !user ? (
          <div className="card-premium rounded-3xl p-8 text-center">
            <p className="font-display text-lg font-bold">Inicia sesión para verificarte</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Necesitas una cuenta para subir tus documentos de forma segura.
            </p>
            <Button asChild variant="hero" size="lg" className="mt-5 rounded-full gap-2">
              <Link to="/auth">Iniciar sesión <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        ) : status === "approved" ? (
          <div className="card-premium rounded-3xl p-8 text-center">
            <BadgeCheck className="h-12 w-12 text-verified mx-auto" />
            <p className="mt-3 font-display text-xl font-bold">¡Estás verificado!</p>
            <p className="text-sm text-muted-foreground">Tu insignia ya aparece en tu perfil.</p>
          </div>
        ) : status === "pending" ? (
          <div className="card-premium rounded-3xl p-8 text-center">
            <Clock className="h-12 w-12 text-accent mx-auto" />
            <p className="mt-3 font-display text-xl font-bold">Solicitud en revisión</p>
            <p className="text-sm text-muted-foreground">
              Recibimos tus documentos. Te avisaremos en 24-48 horas.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="card-premium rounded-3xl p-6 space-y-5">
            <h2 className="font-display text-xl font-bold">Sube tus documentos</h2>
            <div className="space-y-1.5">
              <Label htmlFor="id">Documento de identidad (foto clara)</Label>
              <Input
                id="id" type="file" accept="image/*,application/pdf"
                onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
                required
                className="bg-background/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="selfie">Selfie con papel "DeseoX + fecha de hoy"</Label>
              <Input
                id="selfie" type="file" accept="image/*"
                onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
                required
                className="bg-background/60"
              />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full rounded-full" disabled={submitting}>
              {submitting ? "Enviando…" : "Enviar para verificación"}
            </Button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Verificacion;
