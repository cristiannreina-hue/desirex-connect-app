// Tipos centrales de DeseoX

/**
 * Categorías simplificadas (3 únicas opciones).
 * Compatibilidad: los valores legacy ("acompanante-*", "diverso") se mapean
 * automáticamente al cargar y nunca se vuelven a guardar.
 */
export type Category = "femenino" | "masculino" | "trans";

/** Tipo de servicio (legacy — ya no se muestra en UI ni se filtra) */
export type ServiceType = "hetero" | "gay" | "bisexual";

/** Categoría de género para el directorio (tabs Mujeres / Hombres / Trans) */
export type Gender = "mujeres" | "hombres" | "trans";

/** Plan de suscripción */
export type Tier = "starter" | "boost" | "elite" | "vip";

/** Estado de la suscripción */
export type SubStatus = "trial" | "active" | "expired" | "cancelled";

export interface Rates {
  short?: number;
  oneHour?: number;
  twoHours?: number;
  fullDay?: number;
}

export interface Subscription {
  tier: Tier;
  status: SubStatus;
  expiresAt: string; // ISO
}

export type AccountType = "visitor" | "creator";

export interface Profile {
  id: string;
  userNumber?: number;
  name: string;
  nickname?: string;
  age: number;
  birthDate: string;
  birthPlace: string;
  height: number;
  weight?: number;
  hairColor?: string;
  measurements?: string;
  country: string;
  department: string;
  city: string;
  workZone?: string;
  category: Category;
  serviceType: ServiceType;
  gender: Gender;
  /** Compat: galería pública (3 fotos limpias) */
  photos: string[];
  publicPhotos?: string[];
  exclusivePhotos?: string[];
  exclusiveVideos?: string[];
  rates: Rates;
  description: string;
  services: string[];
  whatsapp: string;
  telegram: string;
  accountType?: AccountType;
  verified?: boolean;
  ratingAvg?: number;
  ratingCount?: number;
  viewCount?: number;
  lastActiveAt?: string;
  subscription?: Subscription;
}

/** Etiquetas visibles para las 3 categorías nuevas */
export const CATEGORY_LABELS: Record<Category, string> = {
  femenino: "Femenino",
  masculino: "Masculino",
  trans: "Trans / Travesti",
};

/**
 * Normaliza categorías legacy al nuevo modelo de 3 opciones.
 * - acompanante-femenino → femenino
 * - acompanante-masculino → masculino
 * - diverso → trans (mejor coincidencia humana del set anterior)
 */
export const normalizeCategory = (raw?: string | null): Category => {
  switch (raw) {
    case "femenino":
    case "acompanante-femenino":
      return "femenino";
    case "masculino":
    case "acompanante-masculino":
      return "masculino";
    case "trans":
    case "diverso":
      return "trans";
    default:
      return "femenino";
  }
};

/** Mapea una categoría al tab de género del directorio */
export const categoryToGender = (cat: Category): Gender => {
  if (cat === "masculino") return "hombres";
  if (cat === "trans") return "trans";
  return "mujeres";
};

/** Legacy — ya no se muestra, se mantiene para compatibilidad de tipos */
export const SERVICE_LABELS: Record<ServiceType, string> = {
  hetero: "Hetero",
  gay: "Gay",
  bisexual: "Bisexual",
};

export const GENDER_LABELS: Record<Gender, string> = {
  mujeres: "Mujeres",
  hombres: "Hombres",
  trans: "Trans / Travesti",
};


export const TIER_LABELS: Record<Tier, string> = {
  starter: "Starter",
  boost: "Boost",
  elite: "Elite",
  vip: "VIP",
};

/** Orden de visibilidad: VIP primero, Starter al final */
export const TIER_RANK: Record<Tier, number> = {
  vip: 4,
  elite: 3,
  boost: 2,
  starter: 1,
};
