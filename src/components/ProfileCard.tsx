import { Link } from "react-router-dom";
import { MapPin, Sparkles } from "lucide-react";
import type { Profile } from "@/types/profile";
import { CATEGORY_LABELS } from "@/types/profile";
import { formatCOP, minRate } from "@/lib/format";

interface Props {
  profile: Profile;
  index?: number;
}

export const ProfileCard = ({ profile, index = 0 }: Props) => {
  const price = minRate(profile.rates);
  return (
    <Link
      to={`/perfil/${profile.id}`}
      className="group relative block overflow-hidden rounded-3xl bg-card ring-1 ring-border/70 shadow-card transition-all duration-500 hover:ring-accent/70 hover:shadow-glow-soft hover:-translate-y-1.5 animate-fade-in shimmer"
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

        {/* Borde neón al hover */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            boxShadow: "inset 0 0 0 1px hsl(var(--accent) / 0.6), inset 0 0 30px hsl(var(--accent) / 0.18)",
          }}
        />

        {/* Categoría */}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-background/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium ring-1 ring-border/70">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          {CATEGORY_LABELS[profile.category]}
        </span>

        {/* Precio */}
        {price !== null && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-gradient-neon px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow-glow-soft">
            <Sparkles className="h-3 w-3" />
            {formatCOP(price)}
          </span>
        )}

        {/* Info */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
          <h3 className="font-display text-lg font-extrabold leading-tight tracking-tight">
            {profile.name}
            <span className="ml-1 text-foreground/75 font-semibold">· {profile.age}</span>
          </h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-foreground/85">
            <MapPin className="h-3 w-3 text-accent" /> {profile.city}, {profile.department}
          </p>
        </div>
      </div>
    </Link>
  );
};
