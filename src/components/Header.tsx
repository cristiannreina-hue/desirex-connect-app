import { Link, NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Sparkles, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export const Header = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      {/* Línea neón superior */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-neon opacity-70"
      />
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo size="md" />

        <nav className="hidden md:flex items-center gap-1 rounded-full bg-secondary/50 p-1 ring-1 ring-border/60">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-all",
                isActive
                  ? "bg-gradient-primary text-primary-foreground shadow-glow-soft"
                  : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <Compass className="h-4 w-4" /> Explorar
          </NavLink>
        </nav>

        <Button asChild variant="hero" size="sm" className="gap-2 rounded-full">
          <Link to="/registro">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Crear perfil</span>
            <span className="sm:hidden">Crear</span>
          </Link>
        </Button>
      </div>
    </header>
  );
};
