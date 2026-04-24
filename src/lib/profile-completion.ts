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
  const hasAnyRate = !!(p?.rate_short || p?.rate_one_hour || p?.rate_two_hours || p?.rate_full_day);
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
    { key: "rate", label: "Al menos una tarifa", done: hasAnyRate },
    { key: "contact", label: "WhatsApp o Telegram", done: hasContact },
  ];
}

export function getCompletion(p: Partial<DBProfile> | null | undefined) {
  const checks = getCompletionChecks(p);
  const done = checks.filter((c) => c.done).length;
  const total = checks.length;
  const percent = Math.round((done / total) * 100);
  const missing = checks.filter((c) => !c.done);
  return { checks, done, total, percent, missing, isComplete: done === total };
}

export function isProfileComplete(p: Partial<DBProfile> | null | undefined): boolean {
  return getCompletion(p).isComplete;
}
