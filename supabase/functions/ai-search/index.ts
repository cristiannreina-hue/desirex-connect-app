// Convierte una consulta en lenguaje natural en filtros estructurados para explorar perfiles.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "query required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "Convierte la consulta del usuario sobre perfiles de DeseoX en filtros JSON. " +
              "Devuelve SOLO JSON válido (sin markdown). Campos posibles (todos opcionales): " +
              '{"gender":"mujeres|hombres|trans","tab":"content","city":"<ciudad colombiana>","department":"<departamento>","verified":true,"keywords":"<términos libres para nombre/zona>"}.\n' +
              "Mapea sinónimos: 'mujer/chica/morena/rubia' -> mujeres; 'hombre/chico' -> hombres; 'trans/travesti' -> trans; 'contenido/packs/fotos/videos' -> tab=content. " +
              "Si menciona una ciudad colombiana, normalízala con tilde correcta (Bogotá, Medellín, Cali, Barranquilla, Cartagena, Pereira, etc.). " +
              "Si menciona 'verificada/verificado' -> verified=true. " +
              "Si no encuentras nada útil, responde {}.",
          },
          { role: "user", content: String(query).slice(0, 300) },
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
    const raw = (j?.choices?.[0]?.message?.content ?? "{}").trim();
    let filters: any = {};
    try {
      const clean = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      filters = JSON.parse(clean);
    } catch {
      filters = {};
    }
    return new Response(JSON.stringify({ filters }), {
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
