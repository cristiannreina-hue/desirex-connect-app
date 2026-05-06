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

const viewSent = new Set<string>();

export const trackProfileView = async (profileId: string) => {
  if (!profileId || viewSent.has(profileId)) return;
  viewSent.add(profileId);
  try {
    const { data: auth } = await supabase.auth.getUser();
    const viewer_id = auth?.user?.id ?? null;
    if (viewer_id === profileId) return; // don't track self-views
    await supabase.from("profile_views").insert({
      profile_id: profileId,
      viewer_id,
      viewer_fingerprint: getFingerprint(),
    });
  } catch {
    // ignore
  }
};

export const trackContactClick = async (
  profileId: string,
  channel: "whatsapp" | "telegram",
) => {
  if (!profileId) return;
  try {
    const { data: auth } = await supabase.auth.getUser();
    const viewer_id = auth?.user?.id ?? null;
    if (viewer_id === profileId) return;
    await supabase.from("profile_contact_clicks").insert({
      profile_id: profileId,
      channel,
      viewer_id,
      viewer_fingerprint: getFingerprint(),
    });
  } catch {
    // ignore
  }
};
