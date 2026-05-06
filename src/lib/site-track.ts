import { supabase } from "@/integrations/supabase/client";

const FP_KEY = "dx_fp";

const getFingerprint = (): string => {
  try {
    let fp = localStorage.getItem(FP_KEY);
    if (!fp) {
      fp = crypto.randomUUID();
      localStorage.setItem(FP_KEY, fp);
    }
    return fp;
  } catch {
    return "anon";
  }
};

const seen = new Set<string>();

export const trackSiteVisit = async (path: string) => {
  if (seen.has(path)) return;
  seen.add(path);
  try {
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from("site_visits").insert({
      path,
      visitor_id: auth?.user?.id ?? null,
      visitor_fingerprint: getFingerprint(),
    });
  } catch {
    // ignore
  }
};
