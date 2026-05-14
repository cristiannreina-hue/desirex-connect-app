import { useState, useCallback, type MouseEvent } from "react";
import { isPreLaunch } from "@/lib/launch";

export function usePreLaunchGate() {
  const [open, setOpen] = useState(false);

  const intercept = useCallback((e: MouseEvent) => {
    if (!isPreLaunch()) return false;
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
    return true;
  }, []);

  return { open, setOpen, intercept, active: isPreLaunch() };
}
