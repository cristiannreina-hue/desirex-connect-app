import { Link } from "react-router-dom";
import type { Profile } from "@/types/profile";
import { VerifiedBadge } from "./VerifiedBadge";

interface Props {
  profile: Profile;
}

/** Card compacta circular para scroll horizontal "Activos ahora" */
export const ActiveAvatarCard = ({ profile }: Props) => {
  const slug = profile.userNumber ? String(profile.userNumber) : profile.id;
  return (
    <Link
      to={`/perfil/${slug}`}
      className="group flex w-[88px] flex-col items-center text-center"
    >
      <div className="relative">
        <div className="rounded-full p-[2px] bg-gradient-primary">
          <div className="rounded-full p-[2px] bg-background">
            <img
              src={profile.photos[0]}
              alt={profile.name}
              loading="lazy"
              className="h-16 w-16 rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>
        <span className="absolute -bottom-0.5 right-0.5 dot-online" aria-label="Activo ahora" />
      </div>
      <p className="mt-2 text-xs font-semibold truncate w-full inline-flex items-center justify-center gap-1">
        {profile.name.split(" ")[0]}
        {profile.verified && <VerifiedBadge size="sm" />}
      </p>
    </Link>
  );
};
