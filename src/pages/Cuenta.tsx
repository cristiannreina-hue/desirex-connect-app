import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import {
  ShieldCheck, LogOut, Sparkles, ArrowRight, Clock, Crown, Receipt, BadgeCheck, User as UserIcon,
} from "lucide-react";
import { TIER_LABELS } from "@/types/profile";
import { getCompletion } from "@/lib/profile-completion";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Shield } from "lucide-react";
import { useAccountType } from "@/hooks/useAccountType";
import { toast } from "sonner";

const Cuenta = () => {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const { accountType } = useAccountType(user?.id);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [subs, setSubs] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => { document.title = "Mi cuenta · DeseoX"; }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("tier,status,started_at,expires_at")
        .eq("user_id", user.id).order("expires_at", { ascending: false }),
      supabase.from("payments").select("amount_cents,currency,status,tier,paid_at,created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]).then(([p, s, pay]) => {
      setProfile(p.data);
      setSubs(s.data ?? []);
      setPayments(pay.data ?? []);
      setProfileLoading(false);
    });

    // Realtime: refleja cambios del admin (aprobación/rechazo) sin recargar
    const channel = supabase
      .channel(`profile-self-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => setProfile(payload.new),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const status = profile?.verification_status ?? "unverified";
  const isVerified = status === "approved";
  const completion = getCompletion(profile);
  const hasProfile = completion.done > 0;
  const isCreator = (accountType ?? profile?.account_type) === "creator";

  const profileCtaLabel = isCreator
    ? completion.percent === 0 ? "Crear mi perfil" : "Editar mi panel"
    : "Actualizar mi información";

  const handleProfileAction = () => {
    // El Dashboard adapta el formulario al rol (visitor → solo nombre + 1 foto;
    // creator → todos los campos). El trigger protect_account_type bloquea
    // promociones desde el cliente.
    navigate("/dashboard");
  };

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
                  variant="hero"
                  size="sm"
                  className="mt-5 rounded-full gap-1.5 w-full sm:w-auto"
                  onClick={handleProfileAction}
                  disabled={upgrading}
                >
                  {upgrading ? "Abriendo…" : profileCtaLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Verificación de identidad */}
        {isVerified ? (
          <div className="card-glass rounded-3xl p-6 ring-1 ring-success/40 bg-success/5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-success/20 text-success ring-1 ring-success/40 shadow-glow-soft shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-display font-bold inline-flex items-center gap-2">
                  ✓ Cuenta Verificada
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 text-success ring-1 ring-success/40 px-2.5 py-0.5 text-[11px] font-semibold">
                    Identidad confirmada
                  </span>
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Tu insignia dorada ya es visible en tu perfil público.
                </p>
              </div>
            </div>
          </div>
        ) : status === "pending" ? (
          <div className="card-glass rounded-3xl p-6 ring-1 ring-accent/40">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent ring-1 ring-accent/40 shadow-glow-soft shrink-0">
                <Clock className="h-5 w-5 animate-pulse" />
              </span>
              <div className="flex-1">
                <p className="font-display font-bold">Tu verificación está en proceso de revisión</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Tiempo estimado: 24-48 h. Te avisaremos en cuanto se apruebe.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="card-glass rounded-3xl p-6">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow-soft shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-display font-bold">Verificación de identidad</p>
                <p className="text-sm text-muted-foreground">
                  {status === "rejected"
                    ? "Tu última solicitud fue rechazada. Vuelve a intentarlo con fotos más claras."
                    : "Aumenta la confianza con la insignia ✓ Verificado."}
                </p>
              </div>
              <Button asChild variant="hero" size="sm" className="rounded-full gap-1.5">
                <Link to="/verificacion">
                  Verificar <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}

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

        {/* Acceso panel admin */}
        {isAdmin && (
          <div className="card-glass rounded-3xl p-6 ring-1 ring-accent/30">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow-soft shrink-0">
                <Shield className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-display font-bold">Panel de administración</p>
                <p className="text-sm text-muted-foreground">Modera perfiles, verificaciones, planes y pagos.</p>
              </div>
              <Button asChild variant="hero" size="sm" className="rounded-full gap-1.5">
                <Link to="/admin">
                  Entrar <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}
        {/* Historial de suscripciones */}
        <div className="card-glass rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow-soft shrink-0">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display font-bold">Historial de suscripciones</p>
              <p className="text-sm text-muted-foreground">Tus planes activos y anteriores.</p>
            </div>
          </div>
          {subs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aún no tienes suscripciones. <Link to="/planes" className="text-accent hover:underline">Ver planes</Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {subs.map((s, i) => {
                const active = (s.status === "trial" || s.status === "active") && new Date(s.expires_at) > new Date();
                return (
                  <li key={i} className="flex items-center justify-between gap-3 rounded-xl bg-background/40 ring-1 ring-border px-4 py-3">
                    <div>
                      <p className="font-display font-bold text-sm uppercase tracking-wider">
                        {TIER_LABELS[s.tier as keyof typeof TIER_LABELS] ?? s.tier}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.started_at).toLocaleDateString("es-CO")} → {new Date(s.expires_at).toLocaleDateString("es-CO")}
                      </p>
                    </div>
                    <span className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                      active
                        ? "bg-success/10 text-success ring-success/40"
                        : "bg-muted/40 text-muted-foreground ring-border",
                    )}>
                      {active ? "Activo" : s.status === "trial" ? "Prueba" : "Expirado"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Historial de pagos */}
        {payments.length > 0 && (
          <div className="card-glass rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-accent text-accent-foreground shadow-glow-soft shrink-0">
                <Receipt className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display font-bold">Pagos recientes</p>
                <p className="text-sm text-muted-foreground">Últimas transacciones.</p>
              </div>
            </div>
            <ul className="space-y-2">
              {payments.map((p, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-xl bg-background/40 ring-1 ring-border px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {(p.amount_cents / 100).toLocaleString("es-CO")} {p.currency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.paid_at ?? p.created_at).toLocaleDateString("es-CO")} · {p.tier}
                    </p>
                  </div>
                  <span className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                    p.status === "APPROVED"
                      ? "bg-success/10 text-success ring-success/40"
                      : p.status === "PENDING"
                        ? "bg-accent/10 text-accent ring-accent/40"
                        : "bg-destructive/10 text-destructive ring-destructive/40",
                  )}>
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Cuenta;
