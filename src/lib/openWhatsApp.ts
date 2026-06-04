// Disparador robusto para abrir WhatsApp desde cualquier contexto (iframe preview,
// navegador móvil, escritorio). Usa el dominio canónico wa.me, que redirige a la
// app nativa en móvil y a web.whatsapp.com / app de escritorio en desktop.
//
// Estrategia:
//   1. Intenta window.open en una pestaña nueva (caso normal).
//   2. Si el popup es bloqueado (sandbox/iframe), navega la ventana superior
//      con window.top.location.href.
//   3. Como último recurso, navega la ventana actual.

export interface OpenWhatsAppOptions {
  phone: string;
  message?: string;
}

/** Normaliza a E.164 sin "+". Por defecto asume Colombia (+57) para móviles locales. */
export function normalizeWhatsAppNumber(raw?: string | null): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("57")) return digits;
  if (digits.length === 10 && digits.startsWith("3")) return `57${digits}`;
  return digits;
}

export function buildWhatsAppUrl({ phone, message }: OpenWhatsAppOptions): string {
  const normalized = normalizeWhatsAppNumber(phone);
  if (!normalized) return "";
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${normalized}${text}`;
}

export function openWhatsApp(options: OpenWhatsAppOptions): boolean {
  const url = buildWhatsAppUrl(options);
  if (!url) return false;

  try {
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (popup) return true;
  } catch {
    // window.open puede lanzar en iframes con sandbox restrictivo
  }

  // Fallback: navegar la ventana superior (rompe el iframe del preview).
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.href = url;
      return true;
    }
  } catch {
    // window.top puede estar bloqueado por cross-origin
  }

  // Último recurso: navegar la ventana actual.
  window.location.href = url;
  return true;
}
