import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ShieldCheck, LogOut, Sparkles, ArrowRight, Clock } from "lucide-react";

const Cuenta = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => { document.title = "Mi cuenta · DeseoX"; }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const status = profile?.verification_status ?? "unverified";
  const isVerified = status === "approved";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container flex-1 py-10 max-w-2xl mx-auto w-full space-y-6">
        <div className="card-premium rounded-3xl p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Tu cuenta</p>
              <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold tracking-tight inline-flex items-center gap-2 flex-wrap">
                {profile?.display_name ?? user.email}
                {isVerified && <VerifiedBadge size="md" showLabel />}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => signOut().then(() => navigate("/"))} className="gap-1.5">
              <LogOut className="h-4 w-4" /> Salir
            </Button>
          </div>
        </div>

        {/* Verificación CTA */}
        <div className="card-glass rounded-3xl p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow-soft shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-display font-bold">Verificación de identidad</p>
              {isVerified ? (
                <p className="text-sm text-muted-foreground">¡Ya estás verificado! Tu insignia es visible.</p>
              ) : status === "pending" ? (
                <p className="text-sm text-muted-foreground inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-accent" /> En revisión (24-48 h)
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aumenta la confianza con la insignia ✓ Verificado.
                </p>
              )}
            </div>
            <Button asChild variant="hero" size="sm" className="rounded-full gap-1.5">
              <Link to="/verificacion">
                {isVerified ? "Ver" : "Verificar"} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Crear perfil público */}
        <div className="card-glass rounded-3xl p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-accent text-accent-foreground shadow-glow-soft shrink-0">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-display font-bold">Tu perfil público</p>
              <p className="text-sm text-muted-foreground">
                Completa tus datos, fotos y tarifas para aparecer en DeseoX.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/registro">Editar</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cuenta;
