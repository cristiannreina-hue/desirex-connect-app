import { Link } from "react-router-dom";
import { MapPin, Flame } from "lucide-react";
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

export const ProfileCard = ({ profile, index = 0, popular }: Props) => {
  const slug = profile.userNumber ? String(profile.userNumber) : profile.id;
  const tier = profile.subscription?.tier;
  const tierMeta = tier ? TIER_BADGE[tier] : null;
  const showTierBadge = tier === "vip" || tier === "elite";
  const showHighlight = tier === "vip" || tier === "elite";

  return (
    <Link
      to={`/perfil/${slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-3xl bg-card ring-1 shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-glow-soft animate-fade-in shimmer",
        showHighlight ? "ring-accent/40 hover:ring-accent" : "ring-border/70 hover:ring-accent/70",
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={profile.photos[0]}
          alt={`${profile.name}, ${profile.city}`}
          loading="lazy"
          width={768}
          height={960}
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 overlay-bottom" />

        {/* Borde acento al hover */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ boxShadow: "inset 0 0 0 1px hsl(var(--accent) / 0.6), inset 0 0 30px hsl(var(--accent) / 0.18)" }}
        />

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

        {/* Verificado (top-right) */}
        {profile.verified && (
          <span className="absolute top-3 right-3">
            <VerifiedBadge size="sm" />
          </span>
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
        </div>
      </div>
    </Link>
  );
};
