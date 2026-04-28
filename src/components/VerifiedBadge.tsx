import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  /** Activa el efecto medalla dorada brillante */
  animated?: boolean;
}

const sizes = {
  sm: { icon: "h-3 w-3", text: "text-[10px]", pad: "px-1.5 py-0.5", dot: "h-5 w-5" },
  md: { icon: "h-3.5 w-3.5", text: "text-xs", pad: "px-2 py-1", dot: "h-6 w-6" },
  lg: { icon: "h-4 w-4", text: "text-sm", pad: "px-2.5 py-1", dot: "h-7 w-7" },
};

/**
 * Insignia oficial de "Verificado por DeseoX": medalla dorada elegante.
 */
export const VerifiedBadge = ({ className, size = "md", showLabel = false, animated = true }: Props) => {
  const s = sizes[size];

  if (!showLabel) {
    // Solo medalla circular dorada
    return (
      <span
        title="Perfil verificado por DeseoX"
        aria-label="Perfil verificado"
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          s.dot,
          animated && "gold-medal",
          !animated && "bg-gold/90 ring-1 ring-gold",
          className,
        )}
      >
        <BadgeCheck className={cn(s.icon, "text-background")} strokeWidth={3} />
      </span>
    );
  }

  return (
    <span
      title="Perfil verificado por DeseoX"
      aria-label="Perfil verificado"
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-bold tracking-wide",
        animated && "gold-medal",
        !animated && "bg-gold/90 text-gold-foreground ring-1 ring-gold",
        s.pad,
        s.text,
        className,
      )}
    >
      <BadgeCheck className={cn(s.icon, "text-background")} strokeWidth={3} />
      <span>Verificado</span>
    </span>
  );
};
