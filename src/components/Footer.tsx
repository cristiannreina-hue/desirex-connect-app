import { Logo } from "./Logo";
import { ShieldCheck, Heart, MapPin, Lock } from "lucide-react";

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

      <div className="container py-14 grid gap-10 md:grid-cols-3 items-start">
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

      {/* Declaración legal y cumplimiento */}
      <div className="border-t border-border/60 bg-background/40">
        <div className="container py-6 grid gap-4 md:grid-cols-[auto_1fr] items-start">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/30 shrink-0">
            <Lock className="h-4 w-4" />
          </span>
          <div className="text-[11px] leading-relaxed text-muted-foreground max-w-4xl">
            <p className="font-bold text-foreground/90 uppercase tracking-wider mb-1">
              Tolerancia cero · Cumplimiento legal
            </p>
            <p>
              DeseoX mantiene una <span className="text-accent font-semibold">política de tolerancia cero con la explotación
              de menores</span> y cualquier forma de trata de personas. Todos los perfiles son verificados manualmente por el equipo
              ejecutivo mediante validación KYC con documento oficial. Las imágenes de identificación se purgan tras la aprobación
              para proteger la privacidad. Reportamos a las autoridades cualquier actividad sospechosa de inmediato. Al usar esta
              plataforma confirmas ser mayor de edad y aceptas nuestros términos de uso responsable.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
