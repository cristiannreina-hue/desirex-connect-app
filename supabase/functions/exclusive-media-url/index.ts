// Devuelve URLs firmadas para fotos/videos exclusivos sólo si el usuario tiene suscripción activa.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const paths: string[] = Array.isArray(body?.paths) ? body.paths : [];
    const profileId: string | undefined = body?.profileId;
    if (!paths.length || !profileId) {
      return new Response(JSON.stringify({ error: "paths and profileId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Si es el dueño, siempre dejar
    let allowed = user.id === profileId;

    if (!allowed) {
      // Verificar suscripción activa del *visitante* (paywall a contenido exclusivo)
      const { data: sub } = await admin
        .from("subscriptions")
        .select("status, expires_at")
        .eq("user_id", user.id)
        .in("status", ["trial", "active"])
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      allowed = !!sub;
    }

    if (!allowed) {
      return new Response(JSON.stringify({ error: "subscription_required" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validar que cada path pertenezca al profileId solicitado
    const safe = paths.filter((p) => typeof p === "string" && p.startsWith(`${profileId}/`));

    const urls = await Promise.all(
      safe.map(async (p) => {
        const { data, error } = await admin.storage
          .from("exclusive-media")
          .createSignedUrl(p, 60 * 30); // 30 min
        return { path: p, url: data?.signedUrl ?? null, error: error?.message };
      })
    );

    return new Response(JSON.stringify({ urls }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("exclusive-media-url error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
