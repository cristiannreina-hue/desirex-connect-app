import { Logo } from "./Logo";
import { ShieldCheck, Heart, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="relative mt-24 border-t border-border/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-neon opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-transparent to-background/0"
        style={{ background: "radial-gradient(60% 100% at 50% 100%, hsl(var(--accent) / 0.08), transparent 70%)" }}
      />

      <div className="container py-12 grid gap-10 md:grid-cols-3 items-start">
        <div className="space-y-3">
          <Logo size="md" />
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Plataforma exclusiva para mayores de 18. Conectamos proveedores
            independientes con personas interesadas, con discreción y respeto.
          </p>
        </div>

        <div className="flex md:justify-center">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-accent" /> Solo +18 — verificación obligatoria
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-accent" /> Cobertura: Colombia 🇨🇴
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Heart className="h-4 w-4 text-accent" /> Hecho con detalle, para ti
            </li>
          </ul>
        </div>

        <div className="md:text-right text-xs text-muted-foreground space-y-1">
          <p>© {new Date().getFullYear()} <span className="text-gradient font-semibold">DeseoX</span></p>
          <p className="opacity-70">DeseoX no presta servicios. Conecta personas adultas.</p>
        </div>
      </div>
    </footer>
  );
};
