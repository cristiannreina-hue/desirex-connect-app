/**
 * Aplica marca de agua diagonal repetida ("DeseoX") sobre una imagen.
 * Funciona 100% en el cliente con Canvas. Devuelve un nuevo File listo para subir.
 *
 * Política DeseoX: toda foto subida queda marcada de forma permanente para
 * proteger a Creadores y dificultar el robo de contenido.
 */

import {
  PUBLIC_IMAGE_MAX_SIDE,
  EXCLUSIVE_IMAGE_MAX_SIDE,
  IMAGE_JPEG_QUALITY,
} from "@/lib/compress";

const WATERMARK_TEXT = "DeseoX";
const WATERMARK_BRAND = "deseo-x.com";

interface WatermarkOptions {
  /** Tamaño base del texto en px (se escala con la imagen). Default 28 */
  fontSize?: number;
  /** Opacidad 0-1. Default 0.18 */
  opacity?: number;
  /** Calidad JPEG 0-1. Default 0.82 (compresión equilibrada). */
  quality?: number;
  /** Lado mayor máximo en px tras redimensionar. Default 2000. */
  maxSide?: number;
}

export async function watermarkImage(
  file: File,
  options: WatermarkOptions = {},
): Promise<File> {
  const {
    opacity = 0.18,
    quality = IMAGE_JPEG_QUALITY,
    maxSide = EXCLUSIVE_IMAGE_MAX_SIDE,
  } = options;

  // Solo procesamos imágenes raster
  if (!file.type.startsWith("image/")) return file;
  // SVG/GIF animados: dejar tal cual (canvas los aplanaría)
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  // Redimensionar si excede el lado máximo (mantener aspecto)
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = longest > maxSide ? maxSide / longest : 1;
  const targetW = Math.round(bitmap.width * scale);
  const targetH = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  // Dibuja la imagen redimensionada
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);


  // Escala el tamaño del texto al tamaño de la imagen
  const baseFont = Math.max(
    18,
    Math.round(Math.min(canvas.width, canvas.height) * 0.04),
  );
  const fontSize = options.fontSize ?? baseFont;

  ctx.save();
  // Patrón diagonal: rotamos el contexto y repetimos texto en mosaico
  ctx.rotate((-30 * Math.PI) / 180);
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.6})`;
  ctx.lineWidth = Math.max(1, fontSize * 0.04);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const stepX = fontSize * 10;
  const stepY = fontSize * 5;
  const diag = Math.hypot(canvas.width, canvas.height);

  for (let y = -diag; y < diag; y += stepY) {
    for (let x = -diag; x < diag; x += stepX) {
      ctx.strokeText(WATERMARK_TEXT, x, y);
      ctx.fillText(WATERMARK_TEXT, x, y);
    }
  }
  ctx.restore();

  // Sello sólido en esquina inferior derecha
  ctx.save();
  const stampFont = Math.max(12, Math.round(canvas.width * 0.018));
  ctx.font = `700 ${stampFont}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  const padding = Math.round(canvas.width * 0.015);
  const textY = canvas.height - padding;
  const textX = canvas.width - padding;

  // Fondo semi-transparente para legibilidad
  const stampText = `${WATERMARK_TEXT} · ${WATERMARK_BRAND}`;
  const metrics = ctx.measureText(stampText);
  const boxPad = stampFont * 0.4;
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(
    textX - metrics.width - boxPad,
    textY - stampFont - boxPad,
    metrics.width + boxPad * 2,
    stampFont + boxPad * 2,
  );
  ctx.fillStyle = "rgba(255, 200, 87, 0.95)"; // dorado DeseoX
  ctx.fillText(stampText, textX, textY);
  ctx.restore();

  // Para fotos de perfil siempre convertimos a JPEG (mucho menos peso).
  // El sello de marca de agua ya rellena el fondo, así que la transparencia
  // del PNG no aporta valor en este contexto.
  const outputType = "image/jpeg";
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob failed"))),
      outputType,
      quality,
    );
  });

  // Conserva nombre original cambiando extensión a .jpg
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const newName = `${baseName}_wm.jpg`;

  return new File([blob], newName, { type: outputType, lastModified: Date.now() });
}

/**
 * Aplica marca de agua a cualquier File. Si es video, lo devuelve sin tocar
 * (la protección visual se aplica con overlay en el reproductor).
 * Si es imagen, devuelve la versión marcada.
 */
export async function watermarkFile(
  file: File,
  options: WatermarkOptions = {},
): Promise<File> {
  if (file.type.startsWith("image/")) {
    try {
      return await watermarkImage(file, options);
    } catch (err) {
      console.warn("[watermark] fallo al marcar imagen, se sube original", err);
      return file;
    }
  }
  return file;
}

