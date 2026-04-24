import { Logo } from "./Logo";

export const Footer = () => {
  return (
    <footer className="border-t border-border/60 mt-16">
      <div className="container py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="opacity-60">© {new Date().getFullYear()}</span>
        </div>
        <p className="text-center md:text-right max-w-md leading-relaxed">
          Plataforma exclusiva para mayores de 18 años. DeseoX no presta servicios:
          conecta proveedores independientes con personas interesadas.
        </p>
      </div>
    </footer>
  );
};
