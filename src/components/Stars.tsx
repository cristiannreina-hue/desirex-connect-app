import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  count?: number;
  size?: "xs" | "sm" | "md";
  showCount?: boolean;
  className?: string;
}

export const Stars = ({ value, count, size = "sm", showCount = true, className }: Props) => {
  const dim = size === "xs" ? "h-3 w-3" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const text = size === "xs" ? "text-[10px]" : size === "sm" ? "text-xs" : "text-sm";
  if (!value || value <= 0) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-muted-foreground", text, className)}>
        <Star className={cn(dim, "opacity-40")} /> Sin reseñas
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold", text, className)}>
      <Star className={cn(dim, "fill-[hsl(var(--gold))] text-[hsl(var(--gold))]")} />
      {value.toFixed(1)}
      {showCount && typeof count === "number" && count > 0 && (
        <span className="text-muted-foreground font-normal">({count})</span>
      )}
    </span>
  );
};
