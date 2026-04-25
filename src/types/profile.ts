// Tipos centrales de DeseoX

export type Category =
  | "femenino"
  | "masculino"
  | "trans"
  | "acompanante-masculino"
  | "acompanante-femenino"
  | "diverso";

export type ServiceType = "hetero" | "gay" | "bisexual";

export interface Rates {
  short?: number;       // sesión corta
  oneHour?: number;     // 1 hora
  twoHours?: number;    // 2 horas
  fullDay?: number;     // jornada completa
}

export interface Profile {
  id: string;
  userNumber?: number;   // ID público secuencial (#1001, #1002...)
  name: string;
  age: number;
  birthDate: string;     // ISO
  birthPlace: string;
  height: number;        // cm
  country: string;
  department: string;
  city: string;
  category: Category;
  serviceType: ServiceType;
  photos: string[];
  rates: Rates;
  description: string;
  services: string[];
  whatsapp: string;      // E.164 sin '+'
  telegram: string;      // sin '@'
  verified?: boolean;    // perfil verificado por DeseoX
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
