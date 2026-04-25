import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { MessageDialog } from "@/components/MessageDialog";
import { DEMO_PROFILES } from "@/data/profiles";
import { CATEGORY_LABELS, SERVICE_LABELS, type Profile as ProfileT } from "@/types/profile";
import { formatCOP, RATE_LABELS } from "@/lib/format";
import { ArrowLeft, ChevronLeft, ChevronRight, MapPin, Calendar, Ruler, MessageCircle, Send, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { dbToProfile } from "@/lib/db-mappers";
import { isProfileComplete } from "@/lib/profile-completion";
import { useAuth } from "@/hooks/useAuth";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const demoProfile = useMemo(() => DEMO_PROFILES.find((p) => p.id === id), [id]);
  const [dbProfile, setDbProfile] = useState<ProfileT | null>(null);
  const [loading, setLoading] = useState(!demoProfile);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [messageOpen, setMessageOpen] = useState(false);

  useEffect(() => {
    if (demoProfile || !id) {
      setLoading(false);
      return;
    }
    // Si el id son solo dígitos -> es user_number (#1001). Si no -> es UUID.
    const isNumeric = /^\d+$/.test(id);
    const query = supabase.from("profiles").select("*");
    const filtered = isNumeric
      ? query.eq("user_number" as never, Number(id) as never)
      : query.eq("id", id);

    filtered.maybeSingle().then(({ data }) => {
      if (data && isProfileComplete(data)) setDbProfile(dbToProfile(data));
      setLoading(false);
    });
  }, [id, demoProfile]);

  const profile = demoProfile ?? dbProfile;

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

  const rateEntries = (Object.entries(profile.rates) as [keyof typeof profile.rates, number | undefined][])
    .filter(([, v]) => typeof v === "number") as [keyof typeof RATE_LABELS, number][];

  const waUrl = `https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(`Hola ${profile.name}, te contacto desde DeseoX 🔥`)}`;
  const tgUrl = `https://t.me/${profile.telegram}`;

  return (
    <div className="min-h-screen flex flex-col">
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
                <span className="rounded-full bg-gradient-primary px-3 py-1 text-xs font-semibold shadow-glow-soft">
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

              {/* Indicadores de actividad */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--online))]/10 px-3 py-1 text-xs font-semibold text-[hsl(var(--online))] ring-1 ring-[hsl(var(--online))]/30">
                  <span className="dot-online" /> Activo ahora
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-3 py-1 text-xs font-medium ring-1 ring-border">
                  <Zap className="h-3 w-3 text-accent" /> Responde rápido
                </span>
              </div>

              {/* CTA principal */}
              <Button
                variant="hero"
                size="xl"
                className="w-full mt-5 rounded-full"
                onClick={() => {
                  if (!user) {
                    navigate("/auth");
                    return;
                  }
                  if (user.id === profile.id) return;
                  setMessageOpen(true);
                }}
              >
                <MessageCircle className="h-5 w-5" />
                Enviar mensaje
              </Button>
            </div>

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
                  <span
                    key={s}
                    className="rounded-full bg-secondary px-3 py-1.5 text-sm ring-1 ring-border"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>

            {/* Tarifas */}
            <section>
              <h2 className="font-display text-lg font-bold mb-3">Tarifas</h2>
              <div className="card-glass rounded-2xl divide-y divide-border/60 overflow-hidden">
                {rateEntries.map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4">
                    <span className="text-sm text-muted-foreground">{RATE_LABELS[key]}</span>
                    <span className="font-display font-bold text-lg text-gradient">
                      {formatCOP(value)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Contacto directo (visible solo si el usuario tiene Premium o es el dueño - placeholder visual) */}
            <section className="card-glass rounded-2xl p-5 space-y-4">
              <h2 className="font-display text-lg font-bold">Contacto directo</h2>
              <p className="text-sm text-muted-foreground">
                Habla por chat dentro de DeseoX o contacta directamente.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Button asChild variant="whatsapp" size="xl" className="w-full">
                  <a href={waUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-5 w-5" /> WhatsApp
                  </a>
                </Button>
                <Button asChild variant="telegram" size="xl" className="w-full">
                  <a href={tgUrl} target="_blank" rel="noopener noreferrer">
                    <Send className="h-5 w-5" /> Telegram
                  </a>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />

      <MessageDialog
        open={messageOpen}
        onOpenChange={setMessageOpen}
        recipientId={profile.id}
        recipientName={profile.name}
      />
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
