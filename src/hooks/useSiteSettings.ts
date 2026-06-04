import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  maintenance_mode: boolean;
  maintenance_message: string | null;
  launch_date: string | null;
  signups_open: boolean;
}

const DEFAULTS: SiteSettings = {
  maintenance_mode: false,
  maintenance_message: null,
  launch_date: null,
  signups_open: true,
};

// Shared cache across all subscribers
let cache: SiteSettings = DEFAULTS;
let loaded = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<(s: SiteSettings) => void>();

const notify = () => listeners.forEach((l) => l(cache));

const fetchOnce = () => {
  if (loaded) return Promise.resolve();
  if (inflight) return inflight;
  inflight = (async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("maintenance_mode,maintenance_message,launch_date,signups_open")
      .eq("id", true)
      .maybeSingle();
    if (data) cache = data as SiteSettings;


    loaded = true;
    inflight = null;
    notify();
  })();
  return inflight;
};

export const refreshSiteSettings = async () => {
  loaded = false;
  await fetchOnce();
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(cache);
  const [loading, setLoading] = useState(!loaded);

  useEffect(() => {
    const listener = (s: SiteSettings) => setSettings(s);
    listeners.add(listener);
    fetchOnce().then(() => setLoading(false));
    return () => { listeners.delete(listener); };
  }, []);

  return { settings, loading };
};
