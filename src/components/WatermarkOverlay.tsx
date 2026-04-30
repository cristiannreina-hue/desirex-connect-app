import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WatermarkOverlayProps {
  children: ReactNode;
  className?: string;
  /** Texto repetido. Default 'DeseoX' */
  text?: string;
  /** Tamaño del overlay (sm para thumbs, md para cards, lg para hero) */
  size?: "sm" | "md" | "lg";
}

/**
 * Capa visual no-clickeable con la marca repetida en diagonal sobre cualquier
 * media (img/video). NO reemplaza la marca incrustada, es protección adicional
 * mientras el contenido se ve en pantalla.
 */
export const WatermarkOverlay = ({
  children,
  className,
  text = "DeseoX",
  size = "md",
}: WatermarkOverlayProps) => {
  const fontPx = size === "sm" ? 11 : size === "lg" ? 22 : 16;
  const gap = fontPx * 6;

  // SVG patrón repetido en diagonal
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${gap * 2}' height='${gap}'>
    <text x='0' y='${fontPx + 4}' fill='white' fill-opacity='0.18'
      font-family='system-ui,-apple-system,sans-serif' font-size='${fontPx}' font-weight='600'
      transform='rotate(-30 ${gap} ${gap / 2})'>${text} · ${text} · ${text}</text>
  </svg>`;
  const dataUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 mix-blend-overlay"
        style={{ backgroundImage: dataUrl, backgroundRepeat: "repeat" }}
      />
      {/* Sello esquina inferior derecha */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-1 right-1 z-10 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-accent backdrop-blur-sm"
      >
        DeseoX
      </div>
    </div>
  );
};

export default WatermarkOverlay;
