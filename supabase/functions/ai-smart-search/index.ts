// Búsqueda inteligente: traduce lenguaje natural a filtros estructurados
// para el listado de perfiles de DeseoX.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { query, cities = [] } = await req.json();
    const q = String(query ?? "").trim().slice(0, 300);
    if (!q) {
      return new Response(JSON.stringify({ error: "query required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const knownCities: string[] = Array.isArray(cities)
      ? cities.filter((c: unknown) => typeof c === "string").slice(0, 80)
      : [];

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Convierte una búsqueda en español a filtros para la plataforma DeseoX.
Géneros válidos: "mujeres" | "hombres" | "trans" | "content" (parejas).
quickFilter válidos: "all" | "new" | "verified" | "nearby".
Ciudades válidas (úsalas EXACTAS si coinciden, si no devuelve "all"): ${JSON.stringify(knownCities)}.
Si no detectas un campo, usa "all" o "".`,
          },
          { role: "user", content: q },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "apply_filters",
              description: "Aplica filtros al listado de perfiles",
              parameters: {
                type: "object",
                properties: {
                  gender: { type: "string", enum: ["mujeres", "hombres", "trans", "content"] },
                  city: { type: "string" },
                  quickFilter: { type: "string", enum: ["all", "new", "verified", "nearby"] },
                  keyword: { type: "string", description: "Palabras clave para buscar en bio/nombre" },
                },
                required: ["gender", "city", "quickFilter", "keyword"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "apply_filters" } },
      }),
    });

    if (r.status === 429) {
      return new Response(JSON.stringify({ error: "Demasiadas búsquedas, intenta en un minuto." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (r.status === 402) {
      return new Response(JSON.stringify({ error: "Servicio de IA sin créditos." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!r.ok) {
      const t = await r.text();
      console.error("AI error", r.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const j = await r.json();
    const call = j?.choices?.[0]?.message?.tool_calls?.[0];
    let filters = { gender: "mujeres", city: "all", quickFilter: "all", keyword: "" };
    if (call?.function?.arguments) {
      try { filters = { ...filters, ...JSON.parse(call.function.arguments) }; } catch {}
    }
    if (filters.city && filters.city !== "all" && knownCities.length && !knownCities.includes(filters.city)) {
      filters.city = "all";
    }

    return new Response(JSON.stringify({ filters }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
