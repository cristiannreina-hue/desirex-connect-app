import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { COLOMBIA, DEPARTMENTS, getCityZones } from "@/data/colombia";
import { CATEGORY_LABELS, type Category } from "@/types/profile";
import { X, SlidersHorizontal, MapPin, Heart } from "lucide-react";

export interface Filters {
  department: string;
  city: string;
  zone: string;
  category: Category | "all";
}

export const DEFAULT_FILTERS: Filters = {
  department: "all",
  city: "all",
  zone: "all",
  category: "all",
};

interface Props {
  value: Filters;
  onChange: (next: Filters) => void;
}

export const ProfileFilters = ({ value, onChange }: Props) => {
  const cities =
    value.department !== "all" ? COLOMBIA[value.department] ?? [] : [];
  const zones = value.city !== "all" ? getCityZones(value.city) : [];

  const update = (patch: Partial<Filters>) => onChange({ ...value, ...patch });

  const activeChips: { key: keyof Filters; label: string; icon: JSX.Element }[] = [];
  if (value.department !== "all")
    activeChips.push({ key: "department", label: value.department, icon: <MapPin className="h-3 w-3" /> });
  if (value.city !== "all")
    activeChips.push({ key: "city", label: value.city, icon: <MapPin className="h-3 w-3" /> });
  if (value.zone !== "all")
    activeChips.push({ key: "zone", label: value.zone, icon: <MapPin className="h-3 w-3" /> });
  if (value.category !== "all")
    activeChips.push({ key: "category", label: CATEGORY_LABELS[value.category], icon: <Heart className="h-3 w-3" /> });

  const clearOne = (key: keyof Filters) => {
    if (key === "department") update({ department: "all", city: "all", zone: "all" });
    else if (key === "city") update({ city: "all", zone: "all" });
    else update({ [key]: "all" } as Partial<Filters>);
  };

  return (
    <div className="card-glass rounded-3xl p-4 sm:p-5 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center justify-center rounded-xl bg-gradient-primary p-2 shadow-glow-soft">
          <SlidersHorizontal className="h-4 w-4 text-primary-foreground" />
        </span>
        <div>
          <p className="font-display font-bold text-sm">Filtros inteligentes</p>
          <p className="text-xs text-muted-foreground">Encuentra exactamente lo que buscas</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <Select
          value={value.department}
          onValueChange={(v) => update({ department: v, city: "all", zone: "all" })}
        >
          <SelectTrigger className="bg-background/60 rounded-xl">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Todos los departamentos</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.city}
          onValueChange={(v) => update({ city: v, zone: "all" })}
          disabled={value.department === "all"}
        >
          <SelectTrigger className="bg-background/60 rounded-xl">
            <SelectValue placeholder="Ciudad" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Todas las ciudades</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.zone}
          onValueChange={(v) => update({ zone: v })}
          disabled={zones.length === 0}
        >
          <SelectTrigger className="bg-background/60 rounded-xl">
            <SelectValue placeholder={zones.length ? "Zona" : "Sin zonas"} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Todas las zonas</SelectItem>
            {zones.map((z) => (
              <SelectItem key={z} value={z}>{z}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.category} onValueChange={(v) => update({ category: v as Filters["category"] })}>
          <SelectTrigger className="bg-background/60 rounded-xl">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeChips.length > 0 && (
        <div className="mt-4 flex items-center flex-wrap gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => clearOne(chip.key)}
              className="group inline-flex items-center gap-1.5 rounded-full bg-gradient-primary/10 px-3 py-1 text-xs font-medium ring-1 ring-accent/40 hover:ring-accent transition-all"
            >
              <span className="text-accent">{chip.icon}</span>
              <span>{chip.label}</span>
              <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
            </button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="ml-auto gap-1.5 text-muted-foreground rounded-full"
          >
            <X className="h-3.5 w-3.5" /> Limpiar todo
          </Button>
        </div>
      )}
    </div>
  );
};
