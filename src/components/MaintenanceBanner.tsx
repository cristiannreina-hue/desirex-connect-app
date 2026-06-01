import { Wrench } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export const MaintenanceBanner = () => {
  const { settings } = useSiteSettings();
  if (!settings.maintenance_mode) return null;
  return (
    <div className="sticky top-0 z-50 bg-amber-500/95 text-amber-950 backdrop-blur border-b border-amber-600/50">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2 text-sm font-medium">
        <Wrench className="h-4 w-4 shrink-0" />
        <p className="truncate">
          {settings.maintenance_message?.trim() ||
            "Estamos en mantenimiento. Algunas funciones pueden no estar disponibles."}
        </p>
      </div>
    </div>
  );
};
