import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import {
  ShieldCheck, LogOut, Sparkles, ArrowRight, Clock, CheckCircle2, Circle, Eye, EyeOff,
} from "lucide-react";
import { getCompletion } from "@/lib/profile-completion";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Shield } from "lucide-react";

const Cuenta = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

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
      .then(({ data }) => {
        setProfile(data);
        setProfileLoading(false);
      });
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const status = profile?.verification_status ?? "unverified";
  const isVerified = status === "approved";
  const completion = getCompletion(profile);
  const hasProfile = completion.done > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container flex-1 py-10 max-w-2xl mx-auto w-full space-y-6">
        {/* Header cuenta */}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut().then(() => navigate("/"))}
              className="gap-1.5"
            >
              <LogOut className="h-4 w-4" /> Salir
            </Button>
          </div>
        </div>

        {/* Banner perfil incompleto / publicado */}
        {!profileLoading && (
          <div
            className={cn(
              "card-glass rounded-3xl p-6",
              !completion.isComplete && "ring-1 ring-accent/40",
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-xl shrink-0 shadow-glow-soft",
                  completion.isComplete
                    ? "bg-success/20 text-success ring-1 ring-success/40"
                    : "bg-gradient-accent text-accent-foreground",
                )}
              >
                {completion.isComplete ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold">
                  {completion.isComplete
                    ? "¡Tu perfil está publicado!"
                    : hasProfile
                      ? "Completa tu perfil para que sea visible en la plataforma"
                      : "Completa tu perfil para aparecer en la plataforma"}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {completion.isComplete
                    ? "Cualquier visitante puede encontrarte en búsqueda y swipe."
                    : "Solo los perfiles completos son visibles en listados, búsqueda y swipe."}
                </p>

                {/* Barra progreso */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{completion.percent}% completado</span>
                    <span className="text-muted-foreground">
                      {completion.done} / {completion.total}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-gradient-primary transition-all duration-500"
                      style={{ width: `${completion.percent}%` }}
                    />
                  </div>
                </div>

                {/* Checklist */}
                <ul className="mt-4 grid sm:grid-cols-2 gap-1.5">
                  {completion.checks.map((c) => (
                    <li
                      key={c.key}
                      className={cn(
                        "inline-flex items-center gap-2 text-xs rounded-lg px-2 py-1.5",
                        c.done ? "text-success" : "text-muted-foreground",
                      )}
                    >
                      {c.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className={cn(c.done && "line-through opacity-70")}>{c.label}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant="hero"
                  size="sm"
                  className="mt-5 rounded-full gap-1.5 w-full sm:w-auto"
                >
                  <Link to="/registro">
                    {hasProfile ? "Continuar editando" : "Crear mi perfil"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

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

        {/* Ver perfil público (solo si está completo) */}
        {completion.isComplete && profile?.id && (
          <div className="card-glass rounded-3xl p-6">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-accent text-accent-foreground shadow-glow-soft shrink-0">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-display font-bold">Tu perfil público</p>
                <p className="text-sm text-muted-foreground">Así te ven los visitantes en DeseoX.</p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link to={`/perfil/${profile.id}`}>Ver</Link>
              </Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Cuenta;
