import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  /** Activa el efecto pulso + sheen para perfiles aprobados */
  animated?: boolean;
}

const sizes = {
  sm: { icon: "h-3.5 w-3.5", text: "text-[10px]", pad: "px-1.5 py-0.5" },
  md: { icon: "h-4 w-4", text: "text-xs", pad: "px-2 py-1" },
  lg: { icon: "h-5 w-5", text: "text-sm", pad: "px-2.5 py-1" },
};

/**
 * Insignia oficial de "Verificado por DeseoX".
 * Por defecto animada (pulse + sheen) para reforzar señal de confianza.
 */
export const VerifiedBadge = ({ className, size = "md", showLabel = false, animated = true }: Props) => {
  const s = sizes[size];
  return (
    <span
      title="Perfil verificado por DeseoX"
      aria-label="Perfil verificado"
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-verified/15 ring-1 ring-verified/50 text-verified font-semibold overflow-hidden",
        animated && "verified-pulse",
        s.pad,
        s.text,
        className,
      )}
    >
      <BadgeCheck className={cn(s.icon, "fill-verified text-background relative z-10")} />
      {showLabel && <span className="relative z-10">Verificado</span>}
    </span>
  );
};
