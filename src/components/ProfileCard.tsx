import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import type { Profile } from "@/types/profile";
import { CATEGORY_LABELS } from "@/types/profile";
import { formatCOP, minRate } from "@/lib/format";

interface Props {
  profile: Profile;
}

export const ProfileCard = ({ profile }: Props) => {
  const price = minRate(profile.rates);
  return (
    <Link
      to={`/perfil/${profile.id}`}
      className="group relative block overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-border/60 transition-all duration-300 hover:ring-accent/60 hover:shadow-glow-soft hover:-translate-y-1"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={profile.photos[0]}
          alt={`${profile.name}, ${profile.city}`}
          loading="lazy"
          width={768}
          height={960}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 overlay-bottom" />

        <span className="absolute top-3 left-3 rounded-full bg-background/70 backdrop-blur px-2.5 py-1 text-[11px] font-medium ring-1 ring-border/60">
          {CATEGORY_LABELS[profile.category]}
        </span>

        {price !== null && (
          <span className="absolute top-3 right-3 rounded-full bg-gradient-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-glow-soft">
            desde {formatCOP(price)}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-display text-lg font-bold leading-tight">
            {profile.name}
            <span className="ml-1 text-foreground/80 font-medium">· {profile.age}</span>
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground/80">
            <MapPin className="h-3 w-3" /> {profile.city}, {profile.department}
          </p>
        </div>
      </div>
    </Link>
  );
};
