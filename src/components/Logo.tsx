import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl",
};

export const Logo = ({ className, size = "md" }: LogoProps) => {
  return (
    <Link
      to="/"
      className={cn(
        "font-display font-extrabold tracking-tight inline-flex items-baseline gap-0",
        sizes[size],
        className,
      )}
      aria-label="DeseoX inicio"
    >
      <span className="text-foreground">Deseo</span>
      <span className="text-gradient drop-shadow-[0_0_18px_hsl(var(--accent)/0.6)]">
        X
      </span>
    </Link>
  );
};
