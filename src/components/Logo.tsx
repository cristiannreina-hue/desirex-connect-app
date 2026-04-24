import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withMark?: boolean;
}

const sizes = {
  sm: { text: "text-lg", mark: "h-7 w-7", dot: "text-[10px]" },
  md: { text: "text-2xl", mark: "h-9 w-9", dot: "text-xs" },
  lg: { text: "text-4xl md:text-5xl", mark: "h-14 w-14", dot: "text-base" },
};

export const Logo = ({ className, size = "md", withMark = true }: LogoProps) => {
  const s = sizes[size];
  return (
    <Link
      to="/"
      className={cn(
        "group inline-flex items-center gap-2.5 font-display font-extrabold tracking-tight",
        className,
      )}
      aria-label="DeseoX inicio"
    >
      {withMark && (
        <span
          className={cn(
            "relative inline-flex items-center justify-center rounded-xl bg-gradient-neon font-display font-black text-primary-foreground shadow-glow-soft ring-1 ring-accent/40 transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-105",
            s.mark,
          )}
        >
          <span className="relative z-10">X</span>
          <span
            aria-hidden
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ boxShadow: "inset 0 0 14px hsl(var(--background) / 0.35)" }}
          />
        </span>
      )}
      <span className={cn("inline-flex items-baseline leading-none", s.text)}>
        <span className="text-foreground">Deseo</span>
        <span className="text-gradient text-shadow-glow">X</span>
      </span>
    </Link>
  );
};
