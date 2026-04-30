import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Stars } from "@/components/Stars";
import { ProfileReviews } from "@/components/ProfileReviews";
import { ExclusiveMedia } from "@/components/ExclusiveMedia";
import { WatermarkOverlay } from "@/components/WatermarkOverlay";
import { SeoNoIndex } from "@/components/SeoNoIndex";
import { DEMO_PROFILES } from "@/data/profiles";
import { CATEGORY_LABELS, SERVICE_LABELS, type Profile as ProfileT, type Subscription } from "@/types/profile";

import { TIER_BADGE } from "@/lib/tier";
import {
  ArrowLeft, MapPin, Calendar, Scissors,
  MessageCircle, Send, Zap, Globe, Clock, Eye, Star, Share2, Heart, DollarSign, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { dbToProfile } from "@/lib/db-mappers";
import { isProfileComplete } from "@/lib/profile-completion";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [dbProfile, setDbProfile] = useState<ProfileT | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    const isNumeric = /^\d+$/.test(id);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // Solo perfiles de creadoras son visibles públicamente.
    const query = supabase.from("profiles").select("*").eq("account_type", "creator");
    const filtered = isUuid
      ? query.eq("id", id)
      : isNumeric ? query.eq("user_number" as never, Number(id) as never) : query.eq("id", id);

    filtered.maybeSingle().then(async ({ data }) => {
      if (data && isProfileComplete(data)) {
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("tier, status, expires_at")
          .eq("user_id", data.id)
          .order("expires_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const sub: Subscription | undefined = subData
          ? { tier: subData.tier as Subscription["tier"], status: subData.status as Subscription["status"], expiresAt: subData.expires_at }
          : undefined;
        setDbProfile(dbToProfile(data, sub));
      }
      setLoading(false);
    });
  }, [id]);

  // ¿el visitante tiene suscripción activa?
  useEffect(() => {
    if (!user) { setHasSubscription(false); return; }
    supabase
      .from("subscriptions")
      .select("status, expires_at")
      .eq("user_id", user.id)
      .in("status", ["trial", "active"])
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setHasSubscription(!!data));
  }, [user]);

  const demoProfile = useMemo(
    () => (!dbProfile && !loading ? DEMO_PROFILES.find((p) => p.id === id) : undefined),
    [id, dbProfile, loading],
  );
  const profile = dbProfile ?? demoProfile;

  useEffect(() => {
    if (profile) document.title = `${profile.name}, ${profile.age} · ${profile.city} · DeseoX`;
  }, [profile]);

  const photos = profile?.photos ?? [];

  // Auto-rotación carrusel cada 5s con fade (key change anima)
  useEffect(() => {
    if (photos.length < 2) return;
    const id = setInterval(() => setPhotoIdx((i) => (i + 1) % photos.length), 5000);
    return () => clearInterval(id);
  }, [photos.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SeoNoIndex />
        <Header />
        <main className="container flex-1 py-20 text-center text-muted-foreground">{t("common.loading")}</main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <SeoNoIndex />
        <Header />
        <main className="container flex-1 py-20 text-center">
          <h1 className="font-display text-3xl font-bold mb-3">Perfil no encontrado</h1>
          <Button asChild variant="hero"><Link to="/">Volver al inicio</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const waUrl = `https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(`Hola ${profile.name}, te contacto desde DeseoX 🔥`)}`;
  const tgUrl = `https://t.me/${profile.telegram}`;

  const rates = profile.rates ?? {};
  const hasAnyRate = !!(rates.short || rates.oneHour || rates.twoHours || rates.fullDay);
  const fmtCop = (n?: number) => (n ? `$${n.toLocaleString("es-CO")}` : "—");

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = { title: `${profile.name} · DeseoX`, text: `Mira el perfil de ${profile.name} en DeseoX`, url };
    try {
      if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(url); }
    } catch {}
  };

  const isOwner = user?.id === profile.id;
  const tier = profile.subscription?.tier;
  const tierMeta = tier ? TIER_BADGE[tier] : null;

  const accessExclusive = isOwner || hasSubscription;

  const translate = async () => {
    if (!profile?.description) return;
    if (showTranslated) { setShowTranslated(false); return; }
    if (translation) { setShowTranslated(true); return; }
    setTranslating(true);
    const target = lang === "en" ? "es" : "en";
    const { data, error } = await supabase.functions.invoke("translate-bio", {
      body: { text: profile.description, target },
    });
    setTranslating(false);
    if (!error && data?.translation) {
      setTranslation(data.translation);
      setShowTranslated(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-bottom-nav">
      <SeoNoIndex />
      <Header />

      <main className="container flex-1 py-6 space-y-8">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <Link to="/"><ArrowLeft className="h-4 w-4" /> Volver</Link>
        </Button>

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8">
          {/* Carrusel auto-fade con overlay info */}
          <div className="space-y-3">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-border bg-card shadow-card group">
              <WatermarkOverlay size="lg" className="absolute inset-0 h-full w-full">
                {photos.map((src, i) => (
                  <img
                    key={`${src}-${i}`}
                    src={src}
                    alt={`${profile.name} ${i + 1}`}
                    width={768}
                    height={960}
                    className={cn(
                      "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
                      i === photoIdx ? "opacity-100" : "opacity-0",
                    )}
                  />
                ))}
              </WatermarkOverlay>

              {/* Gradiente inferior + info clave sobre foto */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--online))]/90 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> EN LÍNEA
                  </span>
                  {profile.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/90 px-2.5 py-1 text-[11px] font-bold text-accent-foreground backdrop-blur">
                      ✓ Verificada
                    </span>
                  )}
                </div>
                <button
                  onClick={handleShare}
                  aria-label="Compartir perfil"
                  className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/80 ring-1 ring-border backdrop-blur hover:bg-background transition"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>

              {photos.length > 1 && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIdx(i)}
                      aria-label={`foto ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${i === photoIdx ? "w-6 bg-accent" : "w-1.5 bg-white/60"}`}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Columna info — bloque sólido administrativo */}
          <div className="space-y-4 flex flex-col">
            {/* Cabecera: tags + nombre + ubicación + estatus */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {tierMeta && (
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold tracking-wider", tierMeta.className)}>
                    {tierMeta.emoji} {tierMeta.label}
                  </span>
                )}
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium ring-1 ring-border">
                  {CATEGORY_LABELS[profile.category]}
                </span>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium ring-1 ring-border">
                  {SERVICE_LABELS[profile.serviceType]}
                </span>
                {profile.userNumber && (
                  <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-mono font-bold text-accent ring-1 ring-accent/40">
                    ID #{profile.userNumber}
                  </span>
                )}
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight inline-flex items-center gap-3 flex-wrap">
                <span>{profile.name}<span className="ml-2 text-foreground/70 font-semibold">{profile.age}</span></span>
                {profile.verified && <VerifiedBadge size="lg" showLabel />}
              </h1>
              <div className="mt-2 flex items-center flex-wrap gap-x-3 gap-y-1.5 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {profile.city}{profile.workZone ? ` · ${profile.workZone}` : ""}, {profile.department}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--online))]/15 px-2.5 py-1 text-[11px] font-bold text-[hsl(var(--online))] ring-1 ring-[hsl(var(--online))]/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--online))] animate-pulse" /> Activa ahora
                </span>
              </div>

              {(profile.ratingCount ?? 0) > 0 && (
                <div className="mt-3"><Stars value={profile.ratingAvg ?? 0} count={profile.ratingCount} size="md" /></div>
              )}
            </div>

            {/* Botones de contacto — protagonismo total, una sola fila */}
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="whatsapp" size="xl" className="w-full rounded-full">
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-5 w-5" /> WhatsApp
                </a>
              </Button>
              {profile.telegram ? (
                <Button asChild variant="telegram" size="xl" className="w-full rounded-full">
                  <a href={tgUrl} target="_blank" rel="noopener noreferrer">
                    <Send className="h-5 w-5" /> Telegram
                  </a>
                </Button>
              ) : (
                <Button onClick={handleShare} variant="outline" size="xl" className="w-full rounded-full">
                  <Share2 className="h-5 w-5" /> Compartir
                </Button>
              )}
            </div>

            {/* Sobre mí + widgets de confianza integrados — rellena espacio */}
            <section className="card-glass rounded-2xl p-5 flex-1 flex flex-col">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="font-display text-lg font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" /> {t("profile.about")}
                </h2>
                {profile.description && (
                  <button
                    onClick={translate}
                    className="text-xs inline-flex items-center gap-1 text-accent hover:underline"
                    disabled={translating}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {translating
                      ? t("profile.translating")
                      : showTranslated
                        ? t("profile.translate_to_es")
                        : t("profile.translate_to_en")}
                  </button>
                )}
              </div>

              {/* Mini-widgets de confianza integrados */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <TrustWidget icon={<Zap className="h-3.5 w-3.5" />} label="Respuesta rápida" />
                <TrustWidget icon={<span className="text-sm leading-none">✅</span>} label="Identidad verificada" />
                <TrustWidget icon={<Sparkles className="h-3.5 w-3.5" />} label="Activa hoy" />
              </div>

              <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm flex-1">
                {showTranslated && translation
                  ? translation
                  : (profile.description || "Esta creadora aún no ha añadido una descripción.")}
              </p>

              {(profile.ratingCount ?? 0) > 0 && (
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground inline-flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-accent" />
                    <span className="font-bold text-foreground">{(profile.ratingAvg ?? 0).toFixed(1)}</span>
                    {profile.ratingCount} reseñas
                  </span>
                </div>
              )}
            </section>

            {/* Servicios */}
            {profile.services.length > 0 && (
              <section className="card-glass rounded-2xl p-5">
                <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" /> {t("profile.services")}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.services.map((s) => (
                    <span key={s} className="rounded-full bg-secondary px-3 py-1.5 text-sm ring-1 ring-border">{s}</span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Contenido exclusivo (paywall con signed URLs) */}
        <ExclusiveMedia
          profileId={profile.id}
          exclusivePhotos={profile.exclusivePhotos ?? []}
          exclusiveVideos={profile.exclusiveVideos ?? []}
          hasAccess={accessExclusive}
        />

        {/* Reseñas — solo logueados pueden comentar (lo gestiona el componente) */}
        {user ? (
          <ProfileReviews
            profileId={profile.id}
            ratingAvg={profile.ratingAvg ?? 0}
            ratingCount={profile.ratingCount ?? 0}
          />
        ) : (
          <div className="card-glass rounded-2xl p-5 text-center text-sm text-muted-foreground">
            {t("profile.signin_to_comment")} —{" "}
            <Link to="/auth" className="text-accent hover:underline">Iniciar sesión</Link>
          </div>
        )}
      </main>

      {/* FAB WhatsApp flotante para conversión inmediata */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Contactar a ${profile.name} por WhatsApp`}
        className="fab-whatsapp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>

      <Footer />
      <BottomNav />
    </div>
  );
};

const SidebarStat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-2 rounded-xl bg-background/40 ring-1 ring-border px-3 py-2">
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">{icon}</span>
    <div className="leading-tight">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  </div>
);

const MiniStat = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="card-glass rounded-xl px-3 py-2.5 flex flex-col items-center gap-0.5 text-center">
    <span className="text-accent">{icon}</span>
    <p className="text-sm font-bold leading-none mt-1">{value}</p>
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
  </div>
);

const TrustWidget = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="rounded-xl bg-accent/5 ring-1 ring-accent/20 px-2.5 py-2 flex flex-col items-center gap-1 text-center">
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-accent">{icon}</span>
    <p className="text-[10px] font-semibold leading-tight text-foreground/90">{label}</p>
  </div>
);

export default Profile;
