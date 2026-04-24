import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { COLOMBIA, DEPARTMENTS } from "@/data/colombia";
import { CATEGORY_LABELS, SERVICE_LABELS, type Category, type ServiceType } from "@/types/profile";
import { X } from "lucide-react";

export interface Filters {
  department: string;
  city: string;
  category: Category | "all";
  serviceType: ServiceType | "all";
}

export const DEFAULT_FILTERS: Filters = {
  department: "all",
  city: "all",
  category: "all",
  serviceType: "all",
};

interface Props {
  value: Filters;
  onChange: (next: Filters) => void;
}

export const ProfileFilters = ({ value, onChange }: Props) => {
  const cities =
    value.department !== "all" ? COLOMBIA[value.department] ?? [] : [];

  const update = (patch: Partial<Filters>) => onChange({ ...value, ...patch });

  const hasFilters =
    value.department !== "all" ||
    value.city !== "all" ||
    value.category !== "all" ||
    value.serviceType !== "all";

  return (
    <div className="card-glass rounded-2xl p-3 sm:p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <Select
          value={value.department}
          onValueChange={(v) => update({ department: v, city: "all" })}
        >
          <SelectTrigger className="bg-background/60">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Todos los departamentos</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.city}
          onValueChange={(v) => update({ city: v })}
          disabled={value.department === "all"}
        >
          <SelectTrigger className="bg-background/60">
            <SelectValue placeholder="Ciudad" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Todas las ciudades</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.category} onValueChange={(v) => update({ category: v as Filters["category"] })}>
          <SelectTrigger className="bg-background/60">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.serviceType} onValueChange={(v) => update({ serviceType: v as Filters["serviceType"] })}>
          <SelectTrigger className="bg-background/60">
            <SelectValue placeholder="Tipo de servicio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los servicios</SelectItem>
            {Object.entries(SERVICE_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_FILTERS)} className="gap-1.5 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
};
