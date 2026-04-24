import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProfileCard } from "@/components/ProfileCard";
import { ProfileSwipe } from "@/components/ProfileSwipe";
import { ProfileFilters, DEFAULT_FILTERS, type Filters } from "@/components/ProfileFilters";
import { DEMO_PROFILES } from "@/data/profiles";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Layers, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "swipe";

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, hsl(285 100% 58% / 0.18), transparent 70%), radial-gradient(40% 30% at 80% 100%, hsl(280 87% 36% / 0.18), transparent 70%)",
          }}
        />
        <div className="container py-12 md:py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground ring-1 ring-border/60">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Plataforma premium de perfiles
          </span>
          <h1 className="mt-5 font-display text-4xl md:text-6xl font-extrabold tracking-tight">
            Bienvenido a <span className="text-gradient">DeseoX</span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            Descubre experiencias en tu ciudad. Explora perfiles verificados,
            filtra por ubicación y contacta directamente.
          </p>
        </div>
      </section>

      <main className="container flex-1 py-8 space-y-6">
        {/* Filtros */}
        <ProfileFilters value={filters} onChange={setFilters} />

        {/* Toggle vista + contador */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "perfil" : "perfiles"} disponibles
          </p>
          <div className="inline-flex rounded-full bg-secondary p-1 ring-1 ring-border">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                view === "grid"
                  ? "bg-gradient-primary text-primary-foreground shadow-glow-soft"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={view === "grid"}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
            <button
              onClick={() => setView("swipe")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                view === "swipe"
                  ? "bg-gradient-primary text-primary-foreground shadow-glow-soft"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={view === "swipe"}
            >
              <Layers className="h-3.5 w-3.5" /> Swipe
            </button>
          </div>
        </div>

        {/* Resultados */}
        {filtered.length === 0 ? (
          <div className="card-glass rounded-2xl p-12 text-center">
            <p className="text-lg font-semibold">No encontramos perfiles con esos filtros</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Prueba ampliar la búsqueda o limpiar los filtros.
            </p>
            <Button className="mt-5" variant="hero" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Ver todos los perfiles
            </Button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 animate-fade-in">
            {filtered.map((p) => (
              <ProfileCard key={p.id} profile={p} />
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

export default Index;
