import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { ProfileCard } from "@/components/ProfileCard";
import { ProfileSwipe } from "@/components/ProfileSwipe";
import { ProfileFilters, DEFAULT_FILTERS, type Filters } from "@/components/ProfileFilters";
import { DepartmentSearch } from "@/components/DepartmentSearch";
import { FeaturedProfileCard } from "@/components/FeaturedProfileCard";
import { ActiveAvatarCard } from "@/components/ActiveAvatarCard";
import { DEMO_PROFILES } from "@/data/profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LayoutGrid, Layers, ShieldCheck, Flame, Users,
  Search, X, MapPin, Sparkles, Crown, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { dbRowsToCompleteProfiles } from "@/lib/db-mappers";
import type { Profile } from "@/types/profile";

type ViewMode = "grid" | "swipe";

/** Selecciona N elementos pseudo-aleatorios pero estables */
const sample = <T,>(arr: T[], n: number): T[] => arr.slice(0, n);

const Index = () => {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [view, setView] = useState<ViewMode>("grid");
  const [realProfiles, setRealProfiles] = useState<Profile[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.title = "DeseoX · Conecta con personas reales en tu ciudad";
    supabase
      .from("profiles")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(120)
      .then(({ data }) => setRealProfiles(dbRowsToCompleteProfiles(data ?? [])));
  }, []);

  const allProfiles = useMemo<Profile[]>(
    () => (realProfiles.length > 0 ? realProfiles : DEMO_PROFILES),
    [realProfiles],
  );

  // Secciones derivadas
  const featured = useMemo(() => sample(allProfiles.filter((p) => p.verified), 8).length
    ? sample(allProfiles.filter((p) => p.verified), 8)
    : sample(allProfiles, 8),
  [allProfiles]);

  const topCity = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of allProfiles) counts[p.city] = (counts[p.city] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  }, [allProfiles]);

  const nearby = useMemo(
    () => allProfiles.filter((p) => p.city === topCity).slice(0, 6),
    [allProfiles, topCity],
  );

  const active = useMemo(() => sample(allProfiles, 12), [allProfiles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, "");
    return allProfiles.filter((p) => {
      if (filters.department !== "all" && p.department !== filters.department) return false;
      if (filters.city !== "all" && p.city !== filters.city) return false;
      if (filters.category !== "all" && p.category !== filters.category) return false;
      if (filters.serviceType !== "all" && p.serviceType !== filters.serviceType) return false;
      if (q) {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesId = p.userNumber ? String(p.userNumber).includes(q) : false;
        if (!matchesName && !matchesId) return false;
      }
      return true;
    });
  }, [filters, allProfiles, query]);

  const totalCities = new Set(allProfiles.map((p) => p.city)).size;
  const activeCount = Math.max(12, Math.floor(allProfiles.length * 0.4));

  return (
    <div className="min-h-screen flex flex-col pb-bottom-nav">
      <Header />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div aria-hidden className="absolute inset-0 -z-10 mesh-bg" />
        <div aria-hidden className="absolute inset-0 -z-10 grid-deco opacity-30" />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-30 animate-float-slow"
          style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.5), transparent 70%)" }}
        />

        <div className="container py-14 md:py-20 text-center relative">
          <span className="inline-flex items-center gap-2 rounded-full card-glass px-3.5 py-1.5 text-xs text-muted-foreground">
            <span className="dot-online" />
            <span className="font-medium text-foreground">+{activeCount} usuarios activos ahora</span>
          </span>

          <h1 className="mt-6 font-display text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[0.95]">
            Conecta con personas{" "}
            <span className="text-gradient text-shadow-glow">reales</span>{" "}
            en tu ciudad
          </h1>

          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Explora perfiles, chatea y accede a experiencias o servicios personalizados.
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
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <a href="/registro">Crear mi perfil</a>
            </Button>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
            <Stat icon={<Users className="h-4 w-4" />} value={`${allProfiles.length}+`} label="perfiles" />
            <Divider />
            <Stat icon={<MapPin className="h-4 w-4" />} value={`${totalCities}`} label="ciudades" />
            <Divider />
            <Stat icon={<ShieldCheck className="h-4 w-4" />} value="100%" label="verificado" />
          </div>
        </div>
      </section>

      <main className="flex-1 space-y-14 py-10">
        {/* ================= DESTACADOS ================= */}
        {featured.length > 0 && (
          <Section
            title="Perfiles destacados"
            icon={<Crown className="h-4 w-4" />}
            subtitle="Lo más buscado esta semana"
          >
            <div className="container">
              <div className="h-scroll no-scrollbar">
                {featured.map((p) => (
                  <FeaturedProfileCard key={p.id} profile={p} active={Math.random() > 0.4} />
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* ================= CERCA DE TI ================= */}
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

        {/* ================= ACTIVOS AHORA ================= */}
        {active.length > 0 && (
          <Section
            title="Activos ahora"
            icon={<span className="dot-online" />}
            subtitle="Conectados en este momento"
          >
            <div className="container">
              <div className="h-scroll no-scrollbar">
                {active.map((p) => (
                  <ActiveAvatarCard key={p.id} profile={p} />
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* ================= EXPLORAR (con filtros) ================= */}
        <section id="explorar" className="container space-y-6 scroll-mt-20">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">
              Explorar perfiles
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Filtra por ubicación, categoría o busca por ID.
            </p>
          </div>

          {/* Buscador */}
          <div className="card-glass rounded-2xl p-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                inputMode="search"
                placeholder="Busca por nombre o ID (ej: Camila o 1025)"
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

          <DepartmentSearch
            selectedDepartment={filters.department}
            selectedCity={filters.city}
            onSelect={(department, city) => setFilters({ ...filters, department, city })}
          />

          <ProfileFilters value={filters} onChange={setFilters} />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-display font-bold text-foreground text-base">{filtered.length}</span>{" "}
              {filtered.length === 1 ? "perfil disponible" : "perfiles disponibles"}
            </p>
            <div className="inline-flex rounded-full bg-secondary/70 p-1 ring-1 ring-border backdrop-blur">
              <ToggleBtn active={view === "grid"} onClick={() => setView("grid")}>
                <LayoutGrid className="h-3.5 w-3.5" /> Grid
              </ToggleBtn>
              <ToggleBtn active={view === "swipe"} onClick={() => setView("swipe")}>
                <Layers className="h-3.5 w-3.5" /> Swipe
              </ToggleBtn>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="card-glass rounded-3xl p-12 text-center">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/30">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="font-display text-xl font-bold">No encontramos perfiles con esos filtros</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Prueba ampliar la búsqueda o limpiar los filtros.
              </p>
              <Button className="mt-6 rounded-full" variant="hero" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Ver todos los perfiles
              </Button>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {filtered.map((p, i) => (
                <ProfileCard key={p.id} profile={p} index={i} />
              ))}
            </div>
          ) : (
            <div className="py-4 animate-fade-in">
              <ProfileSwipe profiles={filtered} />
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

const ToggleBtn = ({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
      active
        ? "bg-accent text-accent-foreground"
        : "text-muted-foreground hover:text-foreground",
    )}
  >
    {children}
  </button>
);

export default Index;
