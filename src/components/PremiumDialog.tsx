import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Eye, MessageSquare, Sparkles, TrendingUp } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  reason?: string;
}

const benefits = [
  { icon: TrendingUp, label: "Aparece en Destacados" },
  { icon: Eye, label: "Ve quién visita tu perfil" },
  { icon: MessageSquare, label: "Mensajes ilimitados" },
  { icon: Sparkles, label: "Mayor visibilidad en búsqueda" },
];

export const PremiumDialog = ({
  open,
  onOpenChange,
  title = "Activa Premium para continuar",
  reason = "Has alcanzado el límite gratis. Desbloquea todo y conecta sin límites.",
}: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="card-premium max-w-md p-0 overflow-hidden">
      <div
        aria-hidden
        className="h-24 relative overflow-hidden"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 h-12 w-12 rounded-full bg-background ring-4 ring-background flex items-center justify-center">
          <Crown className="h-6 w-6 text-accent" />
        </div>
      </div>

      <div className="px-6 pt-10 pb-6">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">{reason}</DialogDescription>
        </DialogHeader>

        <ul className="mt-5 space-y-2.5">
          {benefits.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3.5 py-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium">{label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-xl border border-border bg-background/50 p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Plan Premium</p>
          <p className="mt-1 font-display text-3xl font-extrabold">
            <span className="text-gradient">$29.900</span>
            <span className="text-sm text-muted-foreground font-normal">/mes</span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Cancela cuando quieras</p>
        </div>

        <Button
          variant="hero"
          size="lg"
          className="w-full mt-5 rounded-full"
          onClick={() => onOpenChange(false)}
        >
          <Crown className="h-4 w-4" />
          Activar Premium
        </Button>
        <button
          className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onOpenChange(false)}
        >
          Más tarde
        </button>
      </div>
    </DialogContent>
  </Dialog>
);
