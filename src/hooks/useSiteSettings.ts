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

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("maintenance_mode,maintenance_message,launch_date,signups_open")
        .eq("id", true)
        .maybeSingle();
      if (!cancel && data) setSettings(data as SiteSettings);
      if (!cancel) setLoading(false);
    })();
    return () => { cancel = true; };
  }, []);

  return { settings, loading };
};
