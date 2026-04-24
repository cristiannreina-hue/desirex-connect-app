import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { Logo } from "./Logo";

const STORAGE_KEY = "deseox_age_verified";

export const AgeGate = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const verified = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
    if (!verified) setOpen(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const reject = () => {
    window.location.href = "https://www.google.com";
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div className="card-glass max-w-md w-full rounded-2xl p-8 text-center shadow-glow-soft animate-scale-in">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-accent/10 p-4 ring-1 ring-accent/30">
            <ShieldAlert className="h-8 w-8 text-accent" />
          </div>
        </div>
        <Logo size="lg" className="mb-2" />
        <h2 id="age-gate-title" className="font-display text-xl font-bold mb-2">
          Contenido para mayores de 18 años
        </h2>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Esta plataforma contiene perfiles y servicios destinados exclusivamente
          a personas mayores de edad. Al continuar declaras que eres mayor de 18 años
          y aceptas ver contenido para adultos.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1" onClick={reject}>
            Salir
          </Button>
          <Button variant="hero" className="flex-1" onClick={accept}>
            Soy mayor de 18 años
          </Button>
        </div>
      </div>
    </div>
  );
};
