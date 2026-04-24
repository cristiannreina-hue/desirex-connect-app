import { useMemo, useRef, useState } from "react";
import { COLOMBIA, DEPARTMENTS } from "@/data/colombia";
import { Search, MapPin, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_PROFILES } from "@/data/profiles";

interface Props {
  selectedDepartment: string;            // "all" or department name
  selectedCity: string;                  // "all" or city name
  onSelect: (department: string, city: string) => void;
}

const POPULAR = [
  "Antioquia",
  "Bogotá D.C.",
  "Valle del Cauca",
  "Atlántico",
  "Bolívar",
  "Santander",
  "Cundinamarca",
  "Risaralda",
];

type Suggestion =
  | { kind: "dept"; department: string }
  | { kind: "city"; department: string; city: string };

export const DepartmentSearch = ({ selectedDepartment, selectedCity, onSelect }: Props) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Counts of profiles per department for badges
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    DEMO_PROFILES.forEach((p) => {
      map[p.department] = (map[p.department] ?? 0) + 1;
    });
    return map;
  }, []);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results: Suggestion[] = [];

    DEPARTMENTS.forEach((d) => {
      if (d.toLowerCase().includes(q)) results.push({ kind: "dept", department: d });
    });
    Object.entries(COLOMBIA).forEach(([d, cities]) => {
      cities.forEach((c) => {
        if (c.toLowerCase().includes(q)) results.push({ kind: "city", department: d, city: c });
      });
    });
    return results.slice(0, 8);
  }, [query]);

  const pickDept = (d: string) => {
    onSelect(d, "all");
    setQuery("");
    setOpen(false);
  };
  const pickCity = (d: string, c: string) => {
    onSelect(d, c);
    setQuery("");
    setOpen(false);
  };

  const activeLabel =
    selectedCity !== "all"
      ? `${selectedCity}, ${selectedDepartment}`
      : selectedDepartment !== "all"
        ? selectedDepartment
        : null;

  return (
    <section className="space-y-5">
      {/* Buscador con autocompletar */}
      <div className="card-glass rounded-3xl p-4 sm:p-5 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center justify-center rounded-xl bg-gradient-primary p-2 shadow-glow-soft">
            <MapPin className="h-4 w-4 text-primary-foreground" />
          </span>
          <div>
            <p className="font-display font-bold text-sm">Busca por ubicación</p>
            <p className="text-xs text-muted-foreground">Departamento, ciudad o municipio</p>
          </div>
        </div>

        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder="Ej: Medellín, Antioquia, Cartagena…"
              className="w-full h-12 rounded-2xl bg-background/60 ring-1 ring-border focus:ring-2 focus:ring-accent pl-11 pr-28 text-sm outline-none transition-all"
              aria-label="Buscar departamento o ciudad"
            />
            {activeLabel && (
              <button
                onClick={() => onSelect("all", "all")}
                className="absolute right-2 inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium ring-1 ring-border hover:ring-accent transition-all"
              >
                <span className="truncate max-w-[110px]">{activeLabel}</span>
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Suggestions */}
          {open && suggestions.length > 0 && (
            <div className="absolute z-30 mt-2 w-full rounded-2xl bg-popover shadow-elevated ring-1 ring-border overflow-hidden animate-fade-in">
              <ul className="max-h-72 overflow-y-auto py-1">
                {suggestions.map((s, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() =>
                        s.kind === "dept" ? pickDept(s.department) : pickCity(s.department, s.city)
                      }
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-secondary/70 transition-colors text-left"
                    >
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-accent" />
                        {s.kind === "dept" ? (
                          <span className="font-medium">{s.department}</span>
                        ) : (
                          <span>
                            <span className="font-medium">{s.city}</span>
                            <span className="text-muted-foreground"> · {s.department}</span>
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {s.kind === "dept" ? "departamento" : "ciudad"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Chips rápidos: todos los departamentos */}
        <div className="mt-4 flex items-start gap-3">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1.5 shrink-0">
            Rápido
          </span>
          <div className="flex flex-wrap gap-1.5">
            <Chip
              active={selectedDepartment === "all"}
              onClick={() => onSelect("all", "all")}
            >
              Todos
            </Chip>
            {DEPARTMENTS.map((d) => (
              <Chip
                key={d}
                active={selectedDepartment === d && selectedCity === "all"}
                onClick={() => pickDept(d)}
              >
                {d}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {/* Departamentos destacados */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight">
              Explora por <span className="text-gradient">región</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Los lugares más populares de DeseoX
            </p>
          </div>
          <Sparkles className="h-5 w-5 text-accent" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {POPULAR.map((d, i) => (
            <button
              key={d}
              onClick={() => pickDept(d)}
              className={cn(
                "group relative overflow-hidden rounded-2xl card-premium p-4 text-left transition-all duration-500 hover:-translate-y-1 hover:shadow-glow-soft",
                selectedDepartment === d && "ring-2 ring-accent shadow-glow-soft",
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Glow corner */}
              <div
                aria-hidden
                className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-40 group-hover:opacity-70 transition-opacity blur-2xl"
                style={{
                  background:
                    i % 3 === 0
                      ? "hsl(var(--primary))"
                      : i % 3 === 1
                        ? "hsl(var(--accent))"
                        : "hsl(var(--gold))",
                }}
              />
              <div className="relative">
                <p className="font-display text-base font-extrabold tracking-tight">{d}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {(COLOMBIA[d] ?? []).length} ciudades
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-neon px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {counts[d] ?? 0} perfiles
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

const Chip = ({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={cn(
      "rounded-full px-3 py-1 text-xs font-medium transition-all ring-1",
      active
        ? "bg-gradient-primary text-primary-foreground ring-accent shadow-glow-soft"
        : "bg-secondary/60 ring-border text-muted-foreground hover:text-foreground hover:ring-accent/50",
    )}
  >
    {children}
  </button>
);
