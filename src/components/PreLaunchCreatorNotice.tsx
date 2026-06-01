import { Sparkles } from "lucide-react";
import { LAUNCH_DATE, isPreLaunchFor } from "@/lib/launch";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const GOLD = "#D4AF37";

export function PreLaunchCreatorNotice() {
  const { settings } = useSiteSettings();
  const { isAdmin } = useIsAdmin();
  const target = settings.launch_date ? new Date(settings.launch_date) : LAUNCH_DATE;
  if (isAdmin) return null;
  if (!isPreLaunchFor(target)) return null;
  const dateStr = target.toLocaleDateString("es-CO", {
    day: "numeric", month: "long", year: "numeric",
  });
  return (
    <div
      className="rounded-2xl border bg-black/40 backdrop-blur-xl p-4 flex items-start gap-3"
      style={{ borderColor: `${GOLD}55`, boxShadow: `0 0 24px rgba(212,175,55,0.12)` }}
    >
      <span
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: `${GOLD}22`, color: GOLD }}
      >
        <Sparkles className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold" style={{ color: GOLD }}>
          Estás en modo Pre-Lanzamiento
        </p>
        <p className="text-xs sm:text-sm text-white/80 mt-1 leading-relaxed">
          Tu perfil es visible, pero los clientes solo podrán contactarte a partir del{" "}
          <strong style={{ color: GOLD }}>{dateStr}</strong>. ¡Aprovecha para perfeccionar tu catálogo!
        </p>
      </div>
    </div>
  );
}
