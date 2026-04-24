import { Link, NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Sparkles, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Header = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                "px-3 py-2 text-sm rounded-lg transition-colors",
                isActive ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <span className="inline-flex items-center gap-2"><Search className="h-4 w-4" /> Explorar</span>
          </NavLink>
        </nav>

        <Button asChild variant="hero" size="sm" className="gap-2">
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
