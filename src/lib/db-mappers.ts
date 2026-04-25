// Mapea filas de la tabla `profiles` (DB) al tipo `Profile` usado por la UI.

import type { Profile, Category, ServiceType } from "@/types/profile";
import type { Tables } from "@/integrations/supabase/types";
import { isProfileComplete } from "@/lib/profile-completion";

type Row = Tables<"profiles">;

export function dbToProfile(p: Row & { user_number?: number | null }): Profile {
  return {
    id: p.id,
    userNumber: p.user_number ?? undefined,
    name: p.display_name ?? "Sin nombre",
    age: p.age ?? 18,
    birthDate: p.birth_date ?? "",
    birthPlace: p.birth_place ?? "",
    height: p.height ?? 0,
    country: "Colombia",
    department: p.department ?? "",
    city: p.city ?? "",
    category: (p.category as Category) ?? "femenino",
    serviceType: (p.service_type as ServiceType) ?? "hetero",
    photos: p.photos ?? [],
    rates: {
      short: p.rate_short ?? undefined,
      oneHour: p.rate_one_hour ?? undefined,
      twoHours: p.rate_two_hours ?? undefined,
      fullDay: p.rate_full_day ?? undefined,
    },
    description: p.description ?? "",
    services: p.services ?? [],
    whatsapp: p.whatsapp ?? "",
    telegram: p.telegram ?? "",
    verified: p.is_verified ?? false,
  };
}

export function dbRowsToCompleteProfiles(rows: Row[]): Profile[] {
  return rows.filter(isProfileComplete).map(dbToProfile);
}
