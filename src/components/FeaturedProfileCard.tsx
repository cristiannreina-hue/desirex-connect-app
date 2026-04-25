import { Link } from "react-router-dom";
import { MapPin, Crown } from "lucide-react";
import type { Profile } from "@/types/profile";
import { VerifiedBadge } from "./VerifiedBadge";

interface Props {
  profile: Profile;
  active?: boolean;
}

/** Card premium grande para scroll horizontal "Destacados" */
export const FeaturedProfileCard = ({ profile, active }: Props) => {
  const slug = profile.userNumber ? String(profile.userNumber) : profile.id;
  return (
    <Link
      to={`/perfil/${slug}`}
      className="group relative block w-[260px] sm:w-[280px] overflow-hidden rounded-3xl bg-card ring-1 ring-border/70 shadow-card transition-all duration-500 hover:ring-accent/60 hover:-translate-y-1.5 hover:shadow-glow-soft"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={profile.photos[0]}
          alt={`${profile.name}, ${profile.city}`}
          loading="lazy"
          width={560}
          height={700}
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 overlay-bottom" />

        {/* Badge DESTACADO */}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-3 py-1 text-[11px] font-bold text-primary-foreground shadow-glow-soft">
          <Crown className="h-3 w-3" />
          DESTACADO
        </span>

        {/* Activo ahora */}
        {active && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium ring-1 ring-border/70">
            <span className="dot-online" />
            Activo
          </span>
        )}

        {/* Info */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-display text-xl font-extrabold leading-tight inline-flex items-center gap-1.5 flex-wrap">
            <span>
              {profile.name}
              <span className="ml-1 text-foreground/75 font-semibold">· {profile.age}</span>
            </span>
            {profile.verified && <VerifiedBadge size="sm" />}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-foreground/85">
            <MapPin className="h-3 w-3 text-accent" /> {profile.city}, {profile.department}
          </p>
        </div>
      </div>
    </Link>
  );
};
