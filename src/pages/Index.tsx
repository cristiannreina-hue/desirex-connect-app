import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProfileCard } from "@/components/ProfileCard";
import { ProfileSwipe } from "@/components/ProfileSwipe";
import { ProfileFilters, DEFAULT_FILTERS, type Filters } from "@/components/ProfileFilters";
import { DepartmentSearch } from "@/components/DepartmentSearch";
import { DEMO_PROFILES } from "@/data/profiles";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Layers, Sparkles, ShieldCheck, Flame, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "swipe";

const POPULAR_CITIES = [
  "Medellín", "Bogotá", "Cali", "Cartagena", "Barranquilla",
  "Pereira", "Bucaramanga", "Santa Marta", "Manizales", "Villavicencio",
];

const Index = () => {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [view, setView] = useState<ViewMode>("grid");

  const filtered = useMemo(() => {
    return DEMO_PROFILES.filter((p) => {
      if (filters.department !== "all" && p.department !== filters.department) return false;
      if (filters.city !== "all" && p.city !== filters.city) return false;
      if (filters.category !== "all" && p.category !== filters.category) return false;
      if (filters.serviceType !== "all" && p.serviceType !== filters.serviceType) return false;
      return true;
    });
  }, [filters]);

  const totalCities = new Set(DEMO_PROFILES.map((p) => p.city)).size;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b border-border/60">
        {/* Mesh gradient */}
        <div aria-hidden className="absolute inset-0 -z-10 mesh-bg" />
        {/* Grid sutil */}
        <div aria-hidden className="absolute inset-0 -z-10 grid-deco opacity-40" />
        {/* Orbes flotantes */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-40 animate-float-slow"
          style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.6), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl opacity-40 animate-float-slow"
          style={{
            animationDelay: "2s",
            background: "radial-gradient(circle, hsl(var(--primary) / 0.6), transparent 70%)",
          }}
        />

        <div className="container py-16 md:py-24 text-center relative">
          <span className="inline-flex items-center gap-2 rounded-full card-glass px-3.5 py-1.5 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Plataforma premium · solo +18
          </span>

          <h1 className="mt-6 font-display text-5xl md:text-7xl font-extrabold tracking-tighter leading-[0.95]">
            Bienvenido a{" "}
            <span className="text-gradient text-shadow-glow">DeseoX</span>
          </h1>

          <p className="mt-5 text-base md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Descubre experiencias en tu ciudad. Perfiles verificados,
            filtros precisos y <span className="text-foreground font-medium">contacto directo</span>.
          </p>

          {/* Stats */}
          <div className="mt-8 flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
            <Stat icon={<Users className="h-4 w-4" />} value={`${DEMO_PROFILES.length}+`} label="perfiles" />
            <Divider />
            <Stat icon={<Sparkles className="h-4 w-4" />} value={`${totalCities}`} label="ciudades" />
            <Divider />
            <Stat icon={<ShieldCheck className="h-4 w-4" />} value="100%" label="verificado" />
          </div>

          {/* CTAs */}
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
        </div>

        {/* Marquee de ciudades */}
        <div className="relative border-t border-border/60 bg-background/40 backdrop-blur-md py-4 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10"
          />
          <div className="marquee-track">
            {[...POPULAR_CITIES, ...POPULAR_CITIES].map((city, i) => (
              <span
                key={`${city}-${i}`}
                className="inline-flex items-center gap-2 text-sm font-display font-semibold text-muted-foreground whitespace-nowrap"
              >
                <span className="h-1 w-1 rounded-full bg-accent" />
                {city}
              </span>
            ))}
          </div>
        </div>
      </section>

      <main id="explorar" className="container flex-1 py-10 space-y-6 scroll-mt-20">
        {/* Filtros */}
        <ProfileFilters value={filters} onChange={setFilters} />

        {/* Toggle vista + contador */}
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

        {/* Resultados */}
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
      </main>

      <Footer />
    </div>
  );
};

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
        ? "bg-gradient-primary text-primary-foreground shadow-glow-soft"
        : "text-muted-foreground hover:text-foreground",
    )}
  >
    {children}
  </button>
);

export default Index;
