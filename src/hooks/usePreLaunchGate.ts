import { useState, useCallback, type MouseEvent } from "react";
import { LAUNCH_DATE, isPreLaunchFor } from "@/lib/launch";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function usePreLaunchGate() {
  const [open, setOpen] = useState(false);
  const { settings } = useSiteSettings();
  const { isAdmin } = useIsAdmin();
  const target = settings.launch_date ? new Date(settings.launch_date) : LAUNCH_DATE;
  // Los administradores nunca son bloqueados por el pre-launch
  const active = !isAdmin && isPreLaunchFor(target);

  const intercept = useCallback((e: MouseEvent) => {
    if (!active) return false;
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
    return true;
  }, [active]);

  return { open, setOpen, intercept, active };
}

