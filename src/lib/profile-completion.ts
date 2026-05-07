// Helpers para determinar si un perfil está "completo" y puede publicarse.
// Modelo de 4 pilares para creadoras:
//   1. Información básica (30%)
//   2. Contenido visual: fotos públicas + exclusivas (30%)
//   3. Contacto y bio: descripción + WhatsApp/Telegram (30%)
//   4. Verificación de identidad por admin (10%)
// Sin verificación, el máximo es 90% con mensaje "Esperando verificación de seguridad".

import type { Tables } from "@/integrations/supabase/types";

export type DBProfile = Tables<"profiles">;

export interface CompletionCheck {
  key: string;
  label: string;
  done: boolean;
  weight: number; // % que aporta al total
  pending?: boolean; // true cuando depende de un proceso externo (verificación)
}

const MIN_DESCRIPTION = 40;
// Mínimo alineado al plan más bajo (gratis): 1 foto pública + 1 foto exclusiva.
const MIN_PUBLIC_PHOTOS = 1;
const MIN_EXCLUSIVE_PHOTOS = 1;

export function getCompletionChecks(p: Partial<DBProfile> | null | undefined): CompletionCheck[] {
  const anyP = (p ?? {}) as any;
  const publicPhotos: string[] = anyP.public_photos ?? [];
  const legacyPhotos: string[] = anyP.photos ?? [];
  const photos = publicPhotos.length > 0 ? publicPhotos : legacyPhotos;
  const exclusivePhotos: string[] = anyP.exclusive_photos ?? [];

  // Visitantes: solo necesitan nombre/alias y 1 foto de perfil.
  if (anyP.account_type === "visitor") {
    return [
      { key: "name", label: "Nombre o alias", done: !!p?.display_name?.trim(), weight: 50 },
      { key: "photo", label: "Foto de perfil", done: photos.length >= 1, weight: 50 },
    ];
  }

  // Creadoras: 4 pilares.
  const basicDone =
    !!p?.display_name?.trim() &&
    !!anyP.nickname?.trim?.() &&
    !!p?.department &&
    !!p?.city &&
    !!anyP.work_zone?.trim?.() &&
    !!p?.category;

  const visualDone =
    photos.length >= MIN_PUBLIC_PHOTOS && exclusivePhotos.length >= MIN_EXCLUSIVE_PHOTOS;

  const hasContact =
    !!((p?.whatsapp && p.whatsapp.length >= 8) || (p?.telegram && p.telegram.length >= 3));
  const contactDone =
    (p?.description ?? "").trim().length >= MIN_DESCRIPTION && hasContact;

  const verified = !!p?.is_verified;

  return [
    {
      key: "basic",
      label: "Información básica (nombre, apodo, ubicación, ciudad, zona y categoría)",
      done: basicDone,
      weight: 30,
    },
    {
      key: "visual",
      label: `Contenido visual (mín. ${MIN_PUBLIC_PHOTOS} foto pública y ${MIN_EXCLUSIVE_PHOTOS} exclusiva)`,
      done: visualDone,
      weight: 30,
    },
    {
      key: "contact",
      label: "Contacto y bio (descripción + WhatsApp o Telegram)",
      done: contactDone,
      weight: 30,
    },
    {
      key: "verification",
      label: verified ? "Identidad verificada" : "Esperando verificación de seguridad",
      done: verified,
      weight: 10,
      pending: !verified,
    },
  ];
}

export function getCompletion(p: Partial<DBProfile> | null | undefined) {
  const checks = getCompletionChecks(p);
  const total = checks.length;
  const done = checks.filter((c) => c.done).length;
  const percent = checks.reduce((acc, c) => acc + (c.done ? c.weight : 0), 0);
  const missing = checks.filter((c) => !c.done);

  const isVisitor = (p as any)?.account_type === "visitor";
  const verificationCheck = checks.find((c) => c.key === "verification");
  const awaitingVerification = !isVisitor && !!verificationCheck && !verificationCheck.done;

  // Visitantes: requieren 100%. Creadoras: temporalmente se publican con 90%
  // (los 3 pilares humanos), sin requerir la verificación de identidad.
  const threshold = isVisitor ? 100 : 90;
  const isComplete = percent >= threshold;

  // Mensaje contextual cuando faltan los pilares humanos vs. la verificación.
  const message = awaitingVerification && percent >= 90
    ? "Esperando verificación de seguridad"
    : undefined;

  return {
    checks,
    done,
    total,
    percent,
    missing,
    isComplete,
    awaitingVerification,
    message,
  };
}

export function isProfileComplete(p: Partial<DBProfile> | null | undefined): boolean {
  const c = getCompletion(p);
  // Para mostrar perfiles públicos basta con que los 3 pilares humanos estén
  // completos (≥90%); la verificación no debería ocultar el perfil.
  if ((p as any)?.account_type === "visitor") return c.isComplete;
  return c.percent >= 90;
}
