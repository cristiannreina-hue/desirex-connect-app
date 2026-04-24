import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Profile } from "@/types/profile";
import { CATEGORY_LABELS } from "@/types/profile";
import { formatCOP, minRate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Heart, MapPin, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  profiles: Profile[];
}

export const ProfileSwipe = ({ profiles }: Props) => {
  const [index, setIndex] = useState(0);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const startX = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [profiles.length]);

  if (profiles.length === 0) return null;

  const profile = profiles[index % profiles.length];
  const next = profiles[(index + 1) % profiles.length];
  const price = minRate(profile.rates);

  const advance = (dir: "left" | "right") => {
    setExitDir(dir);
    setTimeout(() => {
      setIndex((i) => (i + 1) % profiles.length);
      setExitDir(null);
      setDragX(0);
    }, 280);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    setDragX(e.clientX - startX.current);
  };
  const onPointerUp = () => {
    if (Math.abs(dragX) > 100) {
      advance(dragX > 0 ? "right" : "left");
    } else {
      setDragX(0);
    }
    startX.current = null;
  };

  const rotation = dragX / 18;
  const transform =
    exitDir === "right"
      ? "translateX(120%) rotate(20deg)"
      : exitDir === "left"
        ? "translateX(-120%) rotate(-20deg)"
        : `translateX(${dragX}px) rotate(${rotation}deg)`;

  return (
    <div className="relative mx-auto w-full max-w-md select-none">
      <div className="relative aspect-[3/4]">
        {/* Tarjeta de fondo (próxima) */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-3xl overflow-hidden ring-1 ring-border/60 scale-[0.94] opacity-70"
        >
          <img
            src={next.photos[0]}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 overlay-bottom" />
        </div>

        {/* Tarjeta activa */}
        <div
          className={cn(
            "absolute inset-0 rounded-3xl overflow-hidden ring-1 ring-border bg-card shadow-card touch-pan-y",
            exitDir ? "transition-transform duration-300 ease-out" : "",
          )}
          style={{ transform, transition: exitDir ? undefined : "transform 0.15s" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <img
            src={profile.photos[0]}
            alt={`${profile.name}, ${profile.city}`}
            width={768}
            height={1024}
            className="h-full w-full object-cover pointer-events-none"
            draggable={false}
          />
          <div className="absolute inset-0 overlay-bottom pointer-events-none" />

          {/* badges */}
          <span className="absolute top-4 left-4 rounded-full bg-background/70 backdrop-blur px-3 py-1 text-xs font-medium ring-1 ring-border/60">
            {CATEGORY_LABELS[profile.category]}
          </span>
          {price !== null && (
            <span className="absolute top-4 right-4 rounded-full bg-gradient-primary px-3 py-1 text-xs font-semibold shadow-glow-soft">
              desde {formatCOP(price)}
            </span>
          )}

          {/* like / nope hints */}
          <span
            className="absolute top-8 left-6 rotate-[-15deg] rounded-xl border-2 border-success px-3 py-1 text-success font-bold tracking-wider"
            style={{ opacity: Math.max(0, dragX / 120) }}
          >
            ME GUSTA
          </span>
          <span
            className="absolute top-8 right-6 rotate-[15deg] rounded-xl border-2 border-destructive px-3 py-1 text-destructive font-bold tracking-wider"
            style={{ opacity: Math.max(0, -dragX / 120) }}
          >
            PASO
          </span>

          <div className="absolute inset-x-0 bottom-0 p-5 pointer-events-none">
            <h3 className="font-display text-2xl font-bold leading-tight">
              {profile.name} <span className="font-medium text-foreground/80">· {profile.age}</span>
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground/85">
              <MapPin className="h-4 w-4" /> {profile.city}, {profile.department}
            </p>
            <p className="mt-2 line-clamp-2 text-sm text-foreground/75">{profile.description}</p>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <Button
          size="icon"
          variant="outline"
          className="h-14 w-14 rounded-full ring-1 ring-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          onClick={() => advance("left")}
          aria-label="Pasar"
        >
          <X className="h-6 w-6" />
        </Button>
        <Button asChild size="icon" variant="outline" className="h-12 w-12 rounded-full">
          <Link to={`/perfil/${profile.id}`} aria-label="Ver perfil">
            <Info className="h-5 w-5" />
          </Link>
        </Button>
        <Button
          size="icon"
          variant="hero"
          className="h-14 w-14 rounded-full animate-pulse-glow"
          onClick={() => advance("right")}
          aria-label="Me gusta"
        >
          <Heart className="h-6 w-6" />
        </Button>
      </div>

      {/* Navegación discreta */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <button
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          onClick={() => setIndex((i) => (i - 1 + profiles.length) % profiles.length)}
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>
        <span>
          {(index % profiles.length) + 1} / {profiles.length}
        </span>
        <button
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          onClick={() => advance("right")}
        >
          Siguiente <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
