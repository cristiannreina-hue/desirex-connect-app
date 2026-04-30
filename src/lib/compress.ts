/**
 * Compresión y validación de medios subidos por creadores.
 *
 * - Imágenes: la compresión va integrada en `watermarkImage` (canvas + toBlob).
 *   Aquí solo exponemos los límites usados, para mantener consistencia.
 * - Videos: el navegador no puede recomprimir video sin librerías pesadas
 *   (ffmpeg.wasm ~30MB). Por eso validamos tamaño y resolución/duración
 *   máximas y rechazamos los archivos demasiado grandes con un mensaje claro.
 */

/** Lado mayor máximo en píxeles para fotos públicas (grid). */
export const PUBLIC_IMAGE_MAX_SIDE = 1600;

/** Lado mayor máximo en píxeles para fotos exclusivas (alta calidad protegida). */
export const EXCLUSIVE_IMAGE_MAX_SIDE = 2000;

/** Calidad JPEG (0–1) usada al recomprimir imágenes. */
export const IMAGE_JPEG_QUALITY = 0.82;

/** Tamaño máximo permitido por video (50 MB). */
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

/** Duración máxima permitida (3 minutos) — protege ancho de banda y costos. */
export const VIDEO_MAX_DURATION_SEC = 180;

const formatMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);

export interface VideoValidationResult {
  ok: boolean;
  reason?: string;
  durationSec?: number;
}

/**
 * Valida un archivo de video antes de subirlo.
 * No recomprime: la idea es rechazar archivos enormes y guiar al creador
 * a subir un archivo más liviano (que la mayoría de móviles ya generan).
 */
export async function validateVideo(file: File): Promise<VideoValidationResult> {
  if (!file.type.startsWith("video/")) {
    return { ok: false, reason: "El archivo no es un video válido." };
  }

  if (file.size > VIDEO_MAX_BYTES) {
    return {
      ok: false,
      reason: `El video pesa ${formatMB(file.size)} MB. El máximo permitido es ${formatMB(
        VIDEO_MAX_BYTES,
      )} MB. Comprímelo o recórtalo antes de subirlo.`,
    };
  }

  // Intentar leer la duración. Si falla (formato poco común), aceptamos igual.
  const duration = await readDuration(file).catch(() => null);
  if (duration && duration > VIDEO_MAX_DURATION_SEC) {
    return {
      ok: false,
      reason: `El video dura ${Math.round(duration)}s. El máximo permitido es ${VIDEO_MAX_DURATION_SEC}s.`,
      durationSec: duration,
    };
  }

  return { ok: true, durationSec: duration ?? undefined };
}

function readDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      const d = video.duration;
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(d) ? d : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("metadata error"));
    };
    video.src = url;
  });
}
