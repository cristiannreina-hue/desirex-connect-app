// Genera una biografía profesional para creadoras a partir de sus datos.
// Requiere usuario autenticado.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      name = "",
      nickname = "",
      age = "",
      city = "",
      department = "",
      category = "",
      service_mode = "presencial",
      hair_color = "",
      keywords = "",
    } = body ?? {};

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const facts = [
      name && `Nombre: ${name}`,
      nickname && `Apodo: ${nickname}`,
      age && `Edad: ${age}`,
      (city || department) && `Ubicación: ${[city, department].filter(Boolean).join(", ")}`,
      category && `Categoría: ${category}`,
      service_mode && `Modalidad: ${service_mode === "contenido" ? "venta de contenido" : "presencial"}`,
      hair_color && `Cabello: ${hair_color}`,
      keywords && `Notas personales: ${String(keywords).slice(0, 300)}`,
    ].filter(Boolean).join("\n");

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Eres copywriter de perfiles para DeseoX (acompañamiento adulto en Colombia). " +
              "Redacta una biografía elegante, sensual pero NO explícita, en primera persona, " +
              "entre 280 y 480 caracteres. Sin emojis excesivos (máximo 2). Sin precios ni contactos. " +
              "Sin palabras vulgares o sexualmente explícitas. Tono cálido, sofisticado, auténtico. " +
              "Responde SOLO con la biografía, sin comillas ni encabezados.",
          },
          { role: "user", content: `Genera la biografía usando estos datos:\n${facts || "Mujer adulta, Colombia."}` },
        ],
      }),
    });

    if (r.status === 429 || r.status === 402) {
      return new Response(JSON.stringify({ error: r.status === 402 ? "Sin créditos IA" : "Demasiadas solicitudes" }), {
        status: r.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const j = await r.json();
    const bio = (j?.choices?.[0]?.message?.content ?? "").trim().slice(0, 500);
    return new Response(JSON.stringify({ bio }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
