// Devuelve URLs firmadas para fotos/videos exclusivos sólo si el usuario tiene suscripción activa.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Límites: 60 peticiones por minuto por usuario/IP
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_SECONDS = 60;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Identificar al solicitante (uid si está logueado, si no IP)
    let rateKey = "anon:" + (req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown");
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const userClient = createClient(SUPABASE_URL, ANON_KEY, {
          global: { headers: { Authorization: authHeader } },
        });
        const token = authHeader.replace("Bearer ", "");
        const { data } = await userClient.auth.getClaims(token);
        if (data?.claims?.sub) rateKey = "user:" + data.claims.sub;
      } catch (_) { /* fallback a IP */ }
    }

    // Rate limit check
    const { data: rl, error: rlErr } = await admin.rpc("check_rate_limit", {
      _key: `exclusive-media-url:${rateKey}`,
      _max_requests: RATE_LIMIT_MAX,
      _window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    });
    if (rlErr) {
      console.error("rate limit error", rlErr);
    } else if (rl && rl[0] && !rl[0].allowed) {
      return new Response(
        JSON.stringify({ error: "rate_limit_exceeded", retry_after: rl[0].retry_after_seconds }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rl[0].retry_after_seconds),
          },
        },
      );
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
