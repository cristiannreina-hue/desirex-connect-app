// Tipos centrales de DeseoX

export type Category =
  | "femenino"
  | "masculino"
  | "trans"
  | "acompanante-masculino"
  | "acompanante-femenino"
  | "diverso";

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

export interface Profile {
  id: string;
  userNumber?: number;
  name: string;
  age: number;
  birthDate: string;
  birthPlace: string;
  height: number;
  country: string;
  department: string;
  city: string;
  category: Category;
  serviceType: ServiceType;
  gender: Gender;
  photos: string[];
  rates: Rates;
  description: string;
  services: string[];
  whatsapp: string;
  telegram: string;
  verified?: boolean;
  ratingAvg?: number;
  ratingCount?: number;
  viewCount?: number;
  lastActiveAt?: string;
  subscription?: Subscription;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  femenino: "Femenino",
  masculino: "Masculino",
  trans: "Trans",
  "acompanante-masculino": "Acompañante masculino",
  "acompanante-femenino": "Acompañante femenino",
  diverso: "Diverso",
};

export const SERVICE_LABELS: Record<ServiceType, string> = {
  hetero: "Hetero",
  gay: "Gay",
  bisexual: "Bisexual",
};

export const GENDER_LABELS: Record<Gender, string> = {
  mujeres: "Mujeres",
  hombres: "Hombres",
  trans: "Trans",
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
