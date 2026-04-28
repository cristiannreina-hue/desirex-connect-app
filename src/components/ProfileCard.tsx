import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { MapPin, Flame, Clock, ShieldCheck } from "lucide-react";
import type { Profile } from "@/types/profile";
import { VerifiedBadge } from "./VerifiedBadge";
import { Stars } from "./Stars";
import { TIER_BADGE } from "@/lib/tier";
import { cn } from "@/lib/utils";

interface Props {
  profile: Profile;
  index?: number;
  popular?: boolean;
}

/** "Activa hace X" pseudo-aleatorio estable basado en el id del perfil */
const fakeActivity = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const min = h % 240; // 0..239 minutos
  if (min < 5) return { label: "Disponible ahora", live: true };
  if (min < 60) return { label: `Activa hace ${min} min`, live: false };
  const hrs = Math.floor(min / 60);
  return { label: `Activa hace ${hrs} h`, live: false };
};

export const ProfileCard = ({ profile, index = 0, popular }: Props) => {
  const slug = profile.userNumber ? String(profile.userNumber) : profile.id;
  const tier = profile.subscription?.tier;
  const tierMeta = tier ? TIER_BADGE[tier] : null;
  const showTierBadge = tier === "vip" || tier === "elite";
  const showHighlight = tier === "vip" || tier === "elite";

  const photos = profile.photos.slice(0, 3);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pre-visualización: rota cada 1.2s mientras hace hover
  useEffect(() => {
    if (!hovering || photos.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setPhotoIdx((i) => (i + 1) % photos.length);
    }, 1200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hovering, photos.length]);

  useEffect(() => {
    if (!hovering) setPhotoIdx(0);
  }, [hovering]);

  const activity = fakeActivity(profile.id);

  return (
    <Link
      to={`/perfil/${slug}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={cn(
        "group relative block overflow-hidden bg-card card-lift animate-fade-in shimmer",
        "rounded-3xl border border-white/[0.06]",
        showHighlight ? "ring-1 ring-accent/40 hover:ring-accent" : "hover:border-accent/40",
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms`, borderRadius: "24px" }}
    >
      <div className="relative aspect-[4/5] overflow-hidden" style={{ borderRadius: "24px" }}>
        {/* Skeleton mientras carga */}
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-secondary to-muted" />
        )}

        {/* Carrusel cross-fade en hover */}
        {photos.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt={`${profile.name}, ${profile.city}`}
            loading="lazy"
            width={768}
            height={960}
            onLoad={i === 0 ? () => setLoaded(true) : undefined}
            className={cn(
              "absolute inset-0 h-full w-full object-cover photo-fade",
              i === photoIdx ? "opacity-100 scale-100 group-hover:scale-110" : "opacity-0 scale-105",
            )}
          />
        ))}

        <div className="absolute inset-0 overlay-bottom" />

        {/* Borde acento al hover */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ boxShadow: "inset 0 0 0 1px hsl(var(--accent) / 0.6), inset 0 0 30px hsl(var(--accent) / 0.18)" }}
        />

        {/* CTA hover: Ver detalles verificados */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/85 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold ring-1 ring-accent/60 text-accent shadow-glow-soft">
            <ShieldCheck className="h-3.5 w-3.5" /> Ver Detalles Verificados
          </span>
        </div>

        {/* TIER (top-left) */}
        {showTierBadge && tierMeta && (
          <span
            className={cn(
              "absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wider",
              tierMeta.className,
            )}
          >
            {tierMeta.emoji} {tierMeta.label}
          </span>
        )}

        {/* Badge POPULAR */}
        {popular && !showTierBadge && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-background/80 backdrop-blur px-2.5 py-1 text-[10px] font-bold ring-1 ring-accent/40 text-accent">
            <Flame className="h-3 w-3" /> POPULAR
          </span>
        )}

        {/* Verificado animado (top-right) */}
        {profile.verified && (
          <span className="absolute top-3 right-3">
            <VerifiedBadge size="sm" animated />
          </span>
        )}

        {/* Indicador hover dots (preview activo) */}
        {hovering && photos.length > 1 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === photoIdx ? "w-5 bg-accent" : "w-3 bg-foreground/40",
                )}
              />
            ))}
          </div>
        )}

        {/* ID único */}
        {profile.userNumber && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-background/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono font-bold tracking-wide text-accent ring-1 ring-accent/40">
            #{profile.userNumber}
          </span>
        )}

        {/* Rating */}
        {(profile.ratingCount ?? 0) > 0 && (
          <span className="absolute bottom-3 right-3 inline-flex items-center rounded-full bg-background/80 backdrop-blur-md px-2 py-0.5 ring-1 ring-border/70">
            <Stars value={profile.ratingAvg ?? 0} count={profile.ratingCount} size="xs" showCount={false} />
          </span>
        )}

        {/* Info */}
        <div className="absolute inset-x-0 bottom-10 p-4 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
          <h3 className="font-display text-lg font-extrabold leading-tight tracking-tight">
            {profile.name}
            <span className="ml-1 text-foreground/75 font-semibold">· {profile.age}</span>
          </h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-foreground/85">
            <MapPin className="h-3 w-3 text-accent" /> {profile.city}
          </p>
          <p className={cn(
            "mt-1 inline-flex items-center gap-1 text-[10px] font-medium",
            activity.live ? "text-[hsl(var(--online))]" : "text-foreground/70",
          )}>
            {activity.live ? <span className="dot-online" /> : <Clock className="h-2.5 w-2.5" />}
            {activity.label}
          </p>
        </div>
      </div>
    </Link>
  );
};
