import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { ProfileCard } from "@/components/ProfileCard";
import { FeaturedProfileCard } from "@/components/FeaturedProfileCard";
import { ActiveAvatarCard } from "@/components/ActiveAvatarCard";
import { PhilosophySection } from "@/components/PhilosophySection";
import { ProfileCardSkeleton } from "@/components/ProfileCardSkeleton";
import { DEMO_PROFILES } from "@/data/profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Flame, Search, X, MapPin, Sparkles, Crown, ChevronRight, Star, TrendingUp, ShieldCheck, BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { dbToProfile } from "@/lib/db-mappers";
import type { Profile, Gender, Subscription } from "@/types/profile";
import { GENDER_LABELS, TIER_RANK } from "@/types/profile";
import { isVisible } from "@/lib/tier";
import { isProfileComplete } from "@/lib/profile-completion";

/* ============== Hero rotativo ============== */
const HERO_SLIDES = [
  {
    title: "Conexiones Auténticas, Seguridad Garantizada",
    subtitle: "La experiencia concierge para encuentros adultos verificados.",
  },
  {
    title: "Dopamina real, bienestar digital",
    subtitle: "Superamos la saturación: rescatamos el valor del encuentro auténtico.",
  },
  {
    title: "Verificación manual del CEO",
    subtitle: "Cada perfil revisado uno a uno. Cero tolerancia con fraudes o menores.",
  },
];

const ACTIVITY_PINGS = [
  "Alguien vio este perfil hace 2 min",
  "Nuevo usuario registrado",
  "Perfil destacado actualizado",
  "+3 reseñas nuevas en los últimos 10 min",
];

/* ============== Helpers ============== */
const tierWeight = (p: Profile) =>
  p.subscription ? TIER_RANK[p.subscription.tier] ?? 0 : 0;

const sortByTier = (a: Profile, b: Profile) => {
  const t = tierWeight(b) - tierWeight(a);
  if (t !== 0) return t;
  return (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0);
};

const Index = () => {
  const [gender, setGender] = useState<Gender>("mujeres");
  const [realProfiles, setRealProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [slideIdx, setSlideIdx] = useState(0);
  const [pingIdx, setPingIdx] = useState(0);
  const [quickFilter, setQuickFilter] = useState<"all" | "new" | "verified" | "nearby">("all");

  /* Carga */
  useEffect(() => {
    document.title = "DeseoX · Conecta con personas reales en tu ciudad";

    const fetchAll = async () => {
      const [{ data: profileRows }, { data: subRows }] = await Promise.all([
        supabase.from("profiles").select("*").order("updated_at", { ascending: false }).limit(200),
        supabase.from("subscriptions").select("user_id, tier, status, expires_at"),
      ]);

      const subsByUser = new Map<string, Subscription>();
      for (const s of subRows ?? []) {
        const cur = subsByUser.get(s.user_id);
        if (!cur || new Date(s.expires_at) > new Date(cur.expiresAt)) {
          subsByUser.set(s.user_id, {
            tier: s.tier as Subscription["tier"],
            status: s.status as Subscription["status"],
            expiresAt: s.expires_at,
          });
        }
      }

      const mapped = (profileRows ?? [])
        .filter(isProfileComplete)
        .map((row) => dbToProfile(row, subsByUser.get(row.id)))
        .filter((p) => isVisible(p.subscription?.status, p.subscription?.expiresAt));

      setRealProfiles(mapped);
      setLoading(false);
    };

    fetchAll();
  }, []);

  /* Hero rotativo */
  useEffect(() => {
    const id = setInterval(() => setSlideIdx((i) => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  /* Activity ping rotativo */
  useEffect(() => {
    const id = setInterval(() => setPingIdx((i) => (i + 1) % ACTIVITY_PINGS.length), 4000);
    return () => clearInterval(id);
  }, []);

  /* Fuente de datos */
  const allProfiles = useMemo<Profile[]>(
    () => (realProfiles.length > 0 ? realProfiles : DEMO_PROFILES),
    [realProfiles],
  );

  /* Filtro por género (tab) + búsqueda + quick filter */
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, "");
    const baseCity = (() => {
      const counts: Record<string, number> = {};
      for (const p of allProfiles) counts[p.city] = (counts[p.city] ?? 0) + 1;
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    })();
    const newCutoff = Date.now() - 1000 * 60 * 60 * 24 * 14; // 14 días

    return allProfiles
      .filter((p) => p.gender === gender)
      .filter((p) => {
        if (!q) return true;
        const matchName = p.name.toLowerCase().includes(q);
        const matchId = p.userNumber ? String(p.userNumber).includes(q) : false;
        const matchCity = p.city.toLowerCase().includes(q);
        return matchName || matchId || matchCity;
      })
      .filter((p) => {
        if (quickFilter === "verified") return p.verified;
        if (quickFilter === "new") {
          const created = (p as Profile & { createdAt?: string }).createdAt;
          return created ? new Date(created).getTime() > newCutoff : false;
        }
        if (quickFilter === "nearby") return baseCity ? p.city === baseCity : true;
        return true;
      })
      .sort(sortByTier);
  }, [allProfiles, gender, query, quickFilter]);

  /* Secciones */
  const topWeek = useMemo(
    () => [...visible].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)).slice(0, 8),
    [visible],
  );
  const bestRated = useMemo(
    () =>
      [...visible]
        .filter((p) => (p.ratingCount ?? 0) > 0)
        .sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0))
        .slice(0, 8),
    [visible],
  );
  const trending = useMemo(
    () => [...visible].filter((p) => p.subscription?.tier === "elite" || p.subscription?.tier === "vip").slice(0, 8),
    [visible],
  );
  const featured = useMemo(
    () => [...visible].filter((p) => p.verified || p.subscription?.tier === "vip").slice(0, 8),
    [visible],
  );
  const topCity = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of visible) counts[p.city] = (counts[p.city] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  }, [visible]);
  const nearby = useMemo(
    () => visible.filter((p) => p.city === topCity).slice(0, 6),
    [visible, topCity],
  );
  const activeNow = useMemo(() => visible.slice(0, 12), [visible]);

  const totalCities = new Set(allProfiles.map((p) => p.city)).size;
  const activeCount = Math.max(12, Math.floor(allProfiles.length * 0.4));

  return (
    <div className="min-h-screen flex flex-col pb-bottom-nav">
      <Header />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b border-border/60 min-h-hero flex items-center">
        <div aria-hidden className="absolute inset-0 -z-10 mesh-bg" />
        <div aria-hidden className="absolute inset-0 -z-10 grid-deco opacity-25" />
        {/* Degradado profundo: negro mate → púrpura nocturno */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(265 40% 14% / 0.6), transparent 60%), linear-gradient(180deg, hsl(240 8% 7%) 0%, hsl(250 14% 5%) 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl opacity-40 animate-float-slow"
          style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.45), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full blur-3xl opacity-30 animate-float-slow"
          style={{ background: "radial-gradient(circle, hsl(265 80% 50% / 0.35), transparent 70%)" }}
        />

        {/* Carrusel de fondo (avatares premium) */}
        {visible.length > 0 && (
          <div aria-hidden className="absolute inset-0 -z-10 flex opacity-[0.06]">
            {visible.slice(0, 6).map((p, i) => (
              <img
                key={p.id + i}
                src={p.photos[0]}
                alt=""
                className="h-full w-1/6 object-cover"
              />
            ))}
          </div>
        )}

        <div className="container py-14 md:py-20 text-center relative">
          {/* Activity ping */}
          <span
            key={pingIdx}
            className="inline-flex items-center gap-2 rounded-full card-glass px-3.5 py-1.5 text-xs animate-fade-in"
          >
            <span className="dot-online" />
            <span className="font-medium">{ACTIVITY_PINGS[pingIdx]}</span>
          </span>

          <h1 className="mt-6 font-display text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[0.95] min-h-[3em] flex items-center justify-center">
            <span key={slideIdx} className="animate-fade-in">
              {HERO_SLIDES[slideIdx].title.split(" ").map((w, i, arr) =>
                i === arr.length - 2 || i === arr.length - 1 ? (
                  <span key={i} className="text-gradient hero-text-glow"> {w} </span>
                ) : (
                  <span key={i}> {w} </span>
                ),
              )}
            </span>
          </h1>

          <p key={`s-${slideIdx}`} className="mt-5 text-base md:text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed animate-fade-in">
            {HERO_SLIDES[slideIdx].subtitle}
          </p>

          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Button
              variant="hero"
              size="lg"
              className="rounded-full gap-2"
              onClick={() => document.getElementById("explorar")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Flame className="h-4 w-4" />
              Explorar perfiles
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full gap-2 btn-shine">
              <a href="/registro">
                <Sparkles className="h-4 w-4" />
                Unirme a DeseoX
              </a>
            </Button>
          </div>

          {/* Escudo de confianza CEO */}
          <div className="mt-7 flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-full card-glass px-4 py-2 ring-1 ring-accent/40 shadow-glow-soft">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div className="text-left leading-tight">
                <div className="text-[11px] uppercase tracking-widest text-accent font-extrabold">Verificación Manual del CEO</div>
                <div className="text-[11px] text-muted-foreground">100% Real · Cero tolerancia con fraude o menores</div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
            <Stat icon={<Flame className="h-4 w-4" />} value={`+${activeCount}`} label="activos ahora" />
            <Divider />
            <Stat icon={<Sparkles className="h-4 w-4" />} value={`${allProfiles.length}+`} label="perfiles" />
            <Divider />
            <Stat icon={<MapPin className="h-4 w-4" />} value={`${totalCities}`} label="ciudades" />
            <Divider />
            <Stat icon={<ShieldCheck className="h-4 w-4" />} value="100%" label="verificado" />
          </div>

          {/* Indicador slides */}
          <div className="mt-8 flex items-center justify-center gap-1.5">
            {HERO_SLIDES.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i === slideIdx ? "w-8 bg-accent" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================= TABS GÉNERO ================= */}
      <section className="border-b border-border/60 sticky top-16 z-30 bg-background/85 backdrop-blur-xl">
        <div className="container py-3 flex items-center justify-center">
          <div className="inline-flex rounded-full bg-secondary/40 p-1 ring-1 ring-border/60">
            {(Object.keys(GENDER_LABELS) as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                aria-pressed={gender === g}
                className={cn(
                  "rounded-full px-5 py-1.5 text-sm font-semibold transition-all",
                  gender === g
                    ? "bg-accent text-accent-foreground shadow-glow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {GENDER_LABELS[g]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="flex-1 space-y-14 py-10">
        {/* TOP SEMANA */}
        {topWeek.length > 0 && (
          <Section title="Top de la semana" icon={<Flame className="h-4 w-4" />} subtitle="Los más buscados">
            <div className="container">
              <div className="h-scroll no-scrollbar">
                {topWeek.map((p) => (
                  <FeaturedProfileCard key={p.id} profile={p} active={Math.random() > 0.4} />
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* MEJOR VALORADAS */}
        {bestRated.length > 0 && (
          <Section title="Mejor valoradas" icon={<Star className="h-4 w-4" />} subtitle="Las que más reseñas positivas tienen">
            <div className="container">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {bestRated.slice(0, 8).map((p, i) => (
                  <ProfileCard key={p.id} profile={p} index={i} popular />
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* EN TENDENCIA */}
        {trending.length > 0 && (
          <Section title="En tendencia" icon={<TrendingUp className="h-4 w-4" />} subtitle="Lo que sube esta semana">
            <div className="container">
              <div className="h-scroll no-scrollbar">
                {trending.map((p) => (
                  <FeaturedProfileCard key={p.id} profile={p} />
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* DESTACADOS */}
        {featured.length > 0 && (
          <Section title="Perfiles destacados" icon={<Crown className="h-4 w-4" />} subtitle="Plan VIP y verificados">
            <div className="container">
              <div className="h-scroll no-scrollbar">
                {featured.map((p) => (
                  <FeaturedProfileCard key={p.id} profile={p} active={Math.random() > 0.5} />
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* CERCA DE TI */}
        {nearby.length > 0 && (
          <Section
            title={`Cerca de ti${topCity ? ` · ${topCity}` : ""}`}
            icon={<MapPin className="h-4 w-4" />}
            subtitle="Los más cercanos a tu zona"
          >
            <div className="container">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {nearby.map((p, i) => (
                  <ProfileCard key={p.id} profile={p} index={i} />
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* ACTIVOS HOY */}
        {activeNow.length > 0 && (
          <Section title="Activos hoy" icon={<span className="dot-online" />} subtitle="Conectados en este momento">
            <div className="container">
              <div className="h-scroll no-scrollbar">
                {activeNow.map((p) => (
                  <ActiveAvatarCard key={p.id} profile={p} />
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* FILOSOFÍA · La Experiencia DeseoX */}
        <PhilosophySection />

        {/* EXPLORAR */}
        <section id="explorar" className="container space-y-6 scroll-mt-32">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">
              Todos los perfiles
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Mostrando {visible.length} {GENDER_LABELS[gender].toLowerCase()} disponibles.
            </p>
          </div>

          {/* Buscador */}
          <div className="card-glass rounded-2xl p-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                inputMode="search"
                placeholder="Busca por nombre, ciudad o ID (ej: Camila, Bogotá o 1025)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 rounded-xl bg-background/60 pl-11 pr-11 text-base border-0"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filtros rápidos inteligentes */}
          <div className="flex items-center gap-2 flex-wrap">
            {([
              { k: "all", label: "Todas", icon: <Sparkles className="h-3.5 w-3.5" /> },
              { k: "new", label: "Nuevas", icon: <Flame className="h-3.5 w-3.5" /> },
              { k: "verified", label: "Verificadas", icon: <BadgeCheck className="h-3.5 w-3.5" /> },
              { k: "nearby", label: `Cerca de ti${topCity ? ` · ${topCity}` : ""}`, icon: <MapPin className="h-3.5 w-3.5" /> },
            ] as const).map((c) => {
              const active = quickFilter === c.k;
              return (
                <button
                  key={c.k}
                  onClick={() => setQuickFilter(c.k)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ring-1",
                    active
                      ? "bg-gradient-primary text-primary-foreground ring-accent shadow-glow-soft"
                      : "bg-secondary/40 text-muted-foreground ring-border hover:text-foreground hover:ring-accent/60",
                  )}
                >
                  {c.icon}
                  {c.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <ProfileCardSkeleton count={8} />
          ) : visible.length === 0 ? (
            <div className="card-glass rounded-3xl p-12 text-center">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/30">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="font-display text-xl font-bold">No encontramos perfiles</p>
              <p className="mt-1 text-sm text-muted-foreground">Prueba cambiar la categoría o limpiar la búsqueda.</p>
              <Button className="mt-6 rounded-full" variant="hero" onClick={() => { setQuery(""); setQuickFilter("all"); }}>
                Limpiar búsqueda
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {visible.map((p, i) => (
                <ProfileCard key={p.id} profile={p} index={i} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

const Section = ({
  title, subtitle, icon, children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="space-y-4">
    <div className="container flex items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight inline-flex items-center gap-2">
          {icon && <span className="text-accent">{icon}</span>}
          {title}
        </h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <a href="#explorar" className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        Ver todos <ChevronRight className="h-3.5 w-3.5" />
      </a>
    </div>
    {children}
  </section>
);

const Stat = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="inline-flex items-center gap-2.5">
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/30">
      {icon}
    </span>
    <div className="text-left leading-tight">
      <div className="font-display font-extrabold text-base">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  </div>
);

const Divider = () => <span aria-hidden className="hidden sm:inline-block h-8 w-px bg-border" />;

export default Index;
