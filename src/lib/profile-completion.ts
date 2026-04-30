// Helpers para determinar si un perfil está "completo" y puede publicarse.

import type { Tables } from "@/integrations/supabase/types";

export type DBProfile = Tables<"profiles">;

export interface CompletionCheck {
  key: string;
  label: string;
  done: boolean;
}

const MIN_DESCRIPTION = 40;
const MIN_PHOTOS = 3;

export function getCompletionChecks(p: Partial<DBProfile> | null | undefined): CompletionCheck[] {
  const photos = (p?.photos ?? []) as string[];

  // Visitantes: solo necesitan nombre/alias y 1 foto de perfil.
  if ((p as any)?.account_type === "visitor") {
    return [
      { key: "name", label: "Nombre o alias", done: !!p?.display_name?.trim() },
      { key: "photo", label: "Foto de perfil", done: photos.length >= 1 },
    ];
  }

  // Creadoras: perfil completo profesional.
  const hasContact = !!((p?.whatsapp && p.whatsapp.length >= 8) || (p?.telegram && p.telegram.length >= 3));
  return [
    { key: "name", label: "Nombre o alias", done: !!p?.display_name?.trim() },
    { key: "age", label: "Edad", done: !!p?.age && p.age >= 18 },
    { key: "location", label: "Departamento y ciudad", done: !!(p?.department && p?.city) },
    { key: "category", label: "Categoría y tipo de servicio", done: !!(p?.category && p?.service_type) },
    {
      key: "description",
      label: `Descripción (mín. ${MIN_DESCRIPTION} caracteres)`,
      done: (p?.description ?? "").trim().length >= MIN_DESCRIPTION,
    },
    { key: "photos", label: `Mínimo ${MIN_PHOTOS} fotos`, done: photos.length >= MIN_PHOTOS },
    { key: "contact", label: "WhatsApp o Telegram", done: hasContact },
  ];
}

export function getCompletion(p: Partial<DBProfile> | null | undefined) {
  const checks = getCompletionChecks(p);
  const done = checks.filter((c) => c.done).length;
  const total = checks.length;
  const percent = Math.round((done / total) * 100);
  const missing = checks.filter((c) => !c.done);
  // Visitantes: requieren 100% (sólo 2 checks). Creadoras: pueden publicar con ≥80%.
  const isVisitor = (p as any)?.account_type === "visitor";
  const threshold = isVisitor ? 100 : 80;
  const isComplete = percent >= threshold;
  return { checks, done, total, percent, missing, isComplete };
}

export function isProfileComplete(p: Partial<DBProfile> | null | undefined): boolean {
  return getCompletion(p).isComplete;
}
