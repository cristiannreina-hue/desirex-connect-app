import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Stars } from "@/components/Stars";
import { ProfileReviews } from "@/components/ProfileReviews";
import { DEMO_PROFILES } from "@/data/profiles";
import { CATEGORY_LABELS, SERVICE_LABELS, TIER_LABELS, type Profile as ProfileT, type Subscription } from "@/types/profile";

import { TIER_BADGE, daysRemaining, subStateColor } from "@/lib/tier";
import {
  ArrowLeft, ChevronLeft, ChevronRight, MapPin, Calendar, Ruler,
  MessageCircle, Send, Zap, Pencil, RefreshCw, Crown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { dbToProfile } from "@/lib/db-mappers";
import { isProfileComplete } from "@/lib/profile-completion";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dbProfile, setDbProfile] = useState<ProfileT | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const isNumeric = /^\d+$/.test(id);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const query = supabase.from("profiles").select("*");
    const filtered = isUuid
      ? query.eq("id", id)
      : isNumeric
        ? query.eq("user_number" as never, Number(id) as never)
        : query.eq("id", id);

    filtered.maybeSingle().then(async ({ data }) => {
      if (data && isProfileComplete(data)) {
        // Cargar suscripción activa
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

  // Fallback a demo SOLO si no se encontró en BD (para tarjetas demo del home)
  const demoProfile = useMemo(
    () => (!dbProfile && !loading ? DEMO_PROFILES.find((p) => p.id === id) : undefined),
    [id, dbProfile, loading],
  );

  const profile = dbProfile ?? demoProfile;


  useEffect(() => {
    if (profile) {
      document.title = `${profile.name}, ${profile.age} · ${profile.city} · DeseoX`;
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container flex-1 py-20 text-center text-muted-foreground">Cargando…</main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container flex-1 py-20 text-center">
          <h1 className="font-display text-3xl font-bold mb-3">Perfil no encontrado</h1>
          <p className="text-muted-foreground mb-6">El perfil que buscas no existe o fue retirado.</p>
          <Button asChild variant="hero">
            <Link to="/">Volver al inicio</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const photos = profile.photos;
  const prevPhoto = () => setPhotoIdx((i) => (i - 1 + photos.length) % photos.length);
  const nextPhoto = () => setPhotoIdx((i) => (i + 1) % photos.length);

  const waUrl = `https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(`Hola ${profile.name}, te contacto desde DeseoX 🔥`)}`;
  const tgUrl = `https://t.me/${profile.telegram}`;

  const isOwner = user?.id === profile.id;
  const tier = profile.subscription?.tier;
  const tierMeta = tier ? TIER_BADGE[tier] : null;
  const days = daysRemaining(profile.subscription?.expiresAt);
  const subColor = subStateColor(profile.subscription?.status, profile.subscription?.expiresAt);
  const subColorClass =
    subColor === "green"
      ? "bg-[hsl(var(--online))]/10 text-[hsl(var(--online))] ring-[hsl(var(--online))]/30"
      : subColor === "yellow"
        ? "bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))] ring-[hsl(var(--gold))]/40"
        : "bg-destructive/10 text-destructive ring-destructive/40";

  return (
    <div className="min-h-screen flex flex-col pb-bottom-nav">
      <Header />

      <main className="container flex-1 py-6 space-y-8">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Galería */}
          <div className="space-y-3">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-border bg-card shadow-card">
              <img
                src={photos[photoIdx]}
                alt={`${profile.name} foto ${photoIdx + 1}`}
                width={768}
                height={960}
                className="h-full w-full object-cover animate-fade-in"
                key={photoIdx}
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    aria-label="Foto anterior"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur p-2 ring-1 ring-border/60 hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    aria-label="Siguiente foto"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur p-2 ring-1 ring-border/60 hover:bg-background transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === photoIdx ? "w-6 bg-accent" : "w-1.5 bg-foreground/40"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {photos.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {photos.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIdx(i)}
                    className={`overflow-hidden rounded-xl ring-1 transition-all ${
                      i === photoIdx ? "ring-accent shadow-glow-soft" : "ring-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={src} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {tierMeta && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold tracking-wider",
                      tierMeta.className,
                    )}
                  >
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
                <span>
                  {profile.name}
                  <span className="ml-2 text-foreground/70 font-semibold">{profile.age}</span>
                </span>
                {profile.verified && <VerifiedBadge size="lg" showLabel />}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4" /> {profile.city}, {profile.department}
              </p>

              {/* Rating */}
              {(profile.ratingCount ?? 0) > 0 && (
                <div className="mt-3">
                  <Stars value={profile.ratingAvg ?? 0} count={profile.ratingCount} size="md" />
                </div>
              )}

              {/* Indicadores */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--online))]/10 px-3 py-1 text-xs font-semibold text-[hsl(var(--online))] ring-1 ring-[hsl(var(--online))]/30">
                  <span className="dot-online" /> Activo ahora
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-3 py-1 text-xs font-medium ring-1 ring-border">
                  <Zap className="h-3 w-3 text-accent" /> Responde rápido
                </span>
              </div>

              {/* CTA principal: WhatsApp */}
              <div className="mt-5 grid sm:grid-cols-2 gap-3">
                <Button
                  asChild
                  variant="whatsapp"
                  size="xl"
                  className="w-full rounded-full"
                >
                  <a href={waUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-5 w-5" />
                    Contactar por WhatsApp
                  </a>
                </Button>
                {profile.telegram && (
                  <Button asChild variant="telegram" size="xl" className="w-full rounded-full">
                    <a href={tgUrl} target="_blank" rel="noopener noreferrer">
                      <Send className="h-5 w-5" /> Telegram
                    </a>
                  </Button>
                )}
              </div>

              {isOwner && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button asChild variant="outline" size="sm" className="rounded-full gap-2">
                    <Link to="/registro">
                      <Pencil className="h-3.5 w-3.5" /> Editar perfil
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="rounded-full gap-2">
                    <Link to="/planes">
                      <Crown className="h-3.5 w-3.5" /> Cambiar plan
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Suscripción (solo dueño) */}
            {isOwner && profile.subscription && (
              <div className="card-glass rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Plan actual</p>
                  <p className="font-display text-lg font-extrabold mt-0.5">
                    {TIER_LABELS[profile.subscription.tier]}
                  </p>
                </div>
                <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1", subColorClass)}>
                  {subColor === "red" ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" /> Expirado
                    </>
                  ) : (
                    <>📅 {days} {days === 1 ? "día restante" : "días restantes"}</>
                  )}
                </div>
                {subColor === "red" && (
                  <Button asChild size="sm" variant="hero" className="rounded-full">
                    <Link to="/planes">Renovar</Link>
                  </Button>
                )}
              </div>
            )}

            {/* Datos */}
            <div className="grid grid-cols-3 gap-3">
              <InfoTile icon={<Calendar className="h-4 w-4" />} label="Edad" value={`${profile.age} años`} />
              <InfoTile icon={<Ruler className="h-4 w-4" />} label="Altura" value={`${profile.height} cm`} />
              <InfoTile icon={<MapPin className="h-4 w-4" />} label="Origen" value={profile.birthPlace.split(",")[0]} />
            </div>

            {/* Descripción */}
            <section>
              <h2 className="font-display text-lg font-bold mb-2">Sobre mí</h2>
              <p className="text-muted-foreground leading-relaxed">{profile.description}</p>
            </section>

            {/* Servicios */}
            <section>
              <h2 className="font-display text-lg font-bold mb-2">Servicios</h2>
              <div className="flex flex-wrap gap-2">
                {profile.services.map((s) => (
                  <span key={s} className="rounded-full bg-secondary px-3 py-1.5 text-sm ring-1 ring-border">
                    {s}
                  </span>
                ))}
              </div>
            </section>

            {/* Reseñas */}
            <ProfileReviews
              profileId={profile.id}
              ratingAvg={profile.ratingAvg ?? 0}
              ratingCount={profile.ratingCount ?? 0}
            />
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

const InfoTile = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="card-glass rounded-2xl p-3 text-center">
    <div className="inline-flex items-center justify-center rounded-full bg-accent/10 text-accent p-1.5 mb-1.5">
      {icon}
    </div>
    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="font-semibold mt-0.5 text-sm">{value}</p>
  </div>
);

export default Profile;
