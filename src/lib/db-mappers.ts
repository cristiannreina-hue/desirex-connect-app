// Mapea filas de la tabla `profiles` (DB) al tipo `Profile` usado por la UI.

import type { Profile, Category, ServiceType, Gender, Subscription } from "@/types/profile";
import type { Tables } from "@/integrations/supabase/types";
import { isProfileComplete } from "@/lib/profile-completion";

type Row = Tables<"profiles"> & {
  gender?: string | null;
  rating_avg?: number | null;
  rating_count?: number | null;
  view_count?: number | null;
  last_active_at?: string | null;
};

export function dbToProfile(p: Row, sub?: Subscription): Profile {
  const anyP = p as any;
  const publicPhotos: string[] = anyP.public_photos ?? [];
  const legacy: string[] = anyP.photos ?? [];
  // Si hay fotos públicas explícitas, usarlas; si no, fallback al campo legacy
  const photos = publicPhotos.length > 0 ? publicPhotos : legacy;
  return {
    id: p.id,
    userNumber: p.user_number ?? undefined,
    name: anyP.nickname || p.display_name || "Sin nombre",
    nickname: anyP.nickname ?? undefined,
    age: p.age ?? 18,
    birthDate: p.birth_date ?? "",
    birthPlace: p.birth_place ?? "",
    height: p.height ?? 0,
    weight: anyP.weight ?? undefined,
    hairColor: anyP.hair_color ?? undefined,
    measurements: anyP.measurements ?? undefined,
    country: "Colombia",
    department: p.department ?? "",
    city: p.city ?? "",
    workZone: anyP.work_zone ?? undefined,
    category: (p.category as Category) ?? "femenino",
    serviceType: (p.service_type as ServiceType) ?? "hetero",
    gender: (p.gender as Gender) ?? "mujeres",
    photos,
    publicPhotos,
    exclusivePhotos: anyP.exclusive_photos ?? [],
    exclusiveVideos: anyP.exclusive_videos ?? [],
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
    accountType: (anyP.account_type as any) ?? "visitor",
    verified: p.is_verified ?? false,
    ratingAvg: p.rating_avg ?? 0,
    ratingCount: p.rating_count ?? 0,
    viewCount: p.view_count ?? 0,
    lastActiveAt: p.last_active_at ?? undefined,
    subscription: sub,
  };
}

export function dbRowsToCompleteProfiles(rows: Row[]): Profile[] {
  return rows.filter(isProfileComplete).map((r) => dbToProfile(r));
}
