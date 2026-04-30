import { Crown, Flame, Sparkles, Zap, Check } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { Tier } from "@/types/profile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PlanDef {
  tier: Tier;
  name: string;
  price: number;
  tagline: string;
  highlight?: boolean;
  icon: React.ReactNode;
  features: string[];
}

const PLANS: PlanDef[] = [
  {
    tier: "starter",
    name: "Starter",
    price: 0,
    tagline: "Para empezar",
    icon: <Sparkles className="h-5 w-5" />,
    features: [
      "Perfil visible 90 días gratis",
      "Aparece en el grid general",
      "Contacto por WhatsApp directo",
      "Recibe reseñas de visitantes",
      "Hasta 6 fotos exclusivas + 2 videos",
    ],
  },
  {
    tier: "boost",
    name: "Boost",
    price: 49900,
    tagline: "Más visibilidad",
    icon: <Flame className="h-5 w-5" />,
    features: [
      "Todo lo del plan Starter",
      "Posición preferente en tu ciudad",
      "Prioridad en 'Activos hoy'",
      "Hasta 12 fotos exclusivas + 5 videos",
      "Hasta 3x más visualizaciones",
    ],
  },
  {
    tier: "elite",
    name: "Elite",
    price: 99900,
    tagline: "El favorito",
    highlight: true,
    icon: <Zap className="h-5 w-5" />,
    features: [
      "Todo lo del plan Boost",
      "Aparece en 'Mejor valoradas' y 'En tendencia'",
      "Badge ⭐ Destacada visible",
      "Hasta 24 fotos exclusivas + 10 videos",
      "Hasta 7x más visualizaciones",
    ],
  },
  {
    tier: "vip",
    name: "VIP",
    price: 199900,
    tagline: "Máxima exposición",
    icon: <Crown className="h-5 w-5" />,
    features: [
      "Todo lo del plan Elite",
      "Fijado primero en 'Top de la semana' y 'Destacados'",
      "Badge 💎 VIP brillante",
      "Aparece primero en TODA la búsqueda",
      "Hasta 48 fotos exclusivas + 20 videos",
      "Hasta 15x más visualizaciones",
    ],
  },
];

const formatCOP = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const Planes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Planes y suscripción · DeseoX";
  }, []);

  const handleSelect = (plan: PlanDef) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (plan.tier === "starter") {
      navigate("/cuenta");
      return;
    }
    // Redirigir a Wompi con referencia userId|tier para identificar el pago
    const reference = `${user.id}|${plan.tier}`;
    const url = `https://checkout.wompi.co/l/test_VPOS_uN1xtS?reference=${encodeURIComponent(reference)}`;
    toast.success("Te redirigimos a Wompi para completar tu pago…", {
      description: "Tu plan se activará apenas confirmemos el pago. Si tarda, escríbenos.",
    });
    setTimeout(() => { window.location.href = url; }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col pb-bottom-nav">
      <Header />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div aria-hidden className="absolute inset-0 -z-10 mesh-bg" />
          <div className="container py-16 md:py-20 text-center">
            <span className="inline-flex items-center gap-2 rounded-full card-glass px-3.5 py-1.5 text-xs">
              <Crown className="h-3 w-3 text-accent" />
              <span className="font-medium">Compite por visibilidad</span>
            </span>
            <h1 className="mt-5 font-display text-4xl md:text-6xl font-extrabold tracking-tighter">
              Elige tu nivel de <span className="text-gradient">visibilidad</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
              Tu perfil empieza con 90 días gratis. Después, sube de plan y aparece arriba en la búsqueda, en
              destacados y recibe muchas más visitas y solicitudes.
            </p>
          </div>
        </section>

        {/* GRID DE PLANES */}
        <section className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLANS.map((p) => (
              <PlanCard key={p.tier} plan={p} onSelect={() => handleSelect(p)} />
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            Pagos procesados por Wompi · Cancela cuando quieras · Precios en pesos colombianos (COP) · Sin permanencia
          </p>
        </section>

        {/* COMPARATIVA */}
        <section className="container pb-16">
          <div className="card-glass rounded-3xl p-6 md:p-10">
            <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-center">
              ¿Por qué subir de plan?
            </h2>
            <div className="mt-8 grid sm:grid-cols-3 gap-6">
              <Benefit
                icon={<Flame className="h-5 w-5" />}
                title="Más visualizaciones"
                description="Los planes superiores aparecen primero en cada sección. Más vistas = más solicitudes."
              />
              <Benefit
                icon={<Crown className="h-5 w-5" />}
                title="Posición destacada"
                description="VIP y Elite ocupan los espacios premium del home. Tu perfil se ve antes que el resto."
              />
              <Benefit
                icon={<Sparkles className="h-5 w-5" />}
                title="Recompensas semanales"
                description="Top 3 de la semana suma días gratis automáticamente. Cumple 3 semanas y gana 1 mes."
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

const PlanCard = ({ plan, onSelect }: { plan: PlanDef; onSelect: () => void }) => (
  <div
    className={cn(
      "relative flex flex-col rounded-3xl p-6 transition-all duration-500",
      plan.highlight
        ? "bg-gradient-to-b from-accent/10 to-card ring-2 ring-accent shadow-glow-soft -translate-y-1"
        : "card-glass hover:-translate-y-1 hover:ring-accent/40",
    )}
  >
    {plan.highlight && (
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-primary px-3 py-1 text-[11px] font-bold text-primary-foreground shadow-glow-soft">
        <Crown className="h-3 w-3" /> EL MÁS POPULAR
      </span>
    )}
    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/30">
      {plan.icon}
    </div>
    <h3 className="mt-4 font-display text-2xl font-extrabold">{plan.name}</h3>
    <p className="text-sm text-muted-foreground">{plan.tagline}</p>

    <div className="mt-5">
      {plan.price === 0 ? (
        <p className="font-display text-3xl font-extrabold">Gratis <span className="text-sm font-medium text-muted-foreground">/ 90 días</span></p>
      ) : (
        <p className="font-display text-3xl font-extrabold">
          {formatCOP(plan.price)}
          <span className="text-sm font-medium text-muted-foreground"> / mes</span>
        </p>
      )}
    </div>

    <ul className="mt-5 space-y-2.5 flex-1">
      {plan.features.map((f) => (
        <li key={f} className="flex items-start gap-2 text-sm">
          <Check className="h-4 w-4 mt-0.5 text-accent shrink-0" />
          <span className="text-foreground/90">{f}</span>
        </li>
      ))}
    </ul>

    <Button
      onClick={onSelect}
      variant={plan.highlight ? "default" : "outline"}
      size="lg"
      className={cn("mt-6 rounded-full w-full", plan.highlight && "btn-shine border-0")}
    >
      {plan.tier === "starter" ? "Empezar gratis" : "Notificarme"}
    </Button>
  </div>
);

const Benefit = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="text-center">
    <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/30">
      {icon}
    </div>
    <h4 className="mt-3 font-display font-bold text-lg">{title}</h4>
    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

export default Planes;
