// Mejora la biografía de creadoras: limpia lenguaje vulgar, mejora redacción
// y respeta un tono elegante. Usa Lovable AI Gateway.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { text, displayName, category, city, mode } = await req.json();
    const input = String(text ?? "").trim().slice(0, 1500);
    if (!input && mode !== "generate") {
      return new Response(JSON.stringify({ error: "text required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const action = mode === "generate" ? "GENERAR DESDE CERO" : "MEJORAR";

    const system = `Eres editor de biografías para una plataforma legal de acompañamiento adulto (+18) en Colombia (DeseoX).
Reglas estrictas (NO negociables):
- Tono elegante, sensual sutil, profesional. NUNCA vulgar, gráfico o sexual explícito.
- NO menciones precios, drogas, menores, violencia, ni servicios ilegales.
- Máximo 480 caracteres. Sin emojis excesivos (máx 2). Sin hashtags.
- Español neutro. Primera persona. Frases cortas, atractivas.
- NO inventes datos verificables (edad exacta, medidas, ubicación) si no se aportan.
Devuelve SOLO el texto final, sin comillas, sin prefacio.`;

    const context: string[] = [];
    if (displayName) context.push(`Nombre: ${displayName}`);
    if (category) context.push(`Categoría: ${category}`);
    if (city) context.push(`Ciudad: ${city}`);
    const ctx = context.length ? `\nDatos del perfil:\n${context.join("\n")}` : "";

    const userPrompt = mode === "generate"
      ? `Acción: ${action}.${ctx}\nGenera una biografía nueva, original y atractiva siguiendo las reglas.`
      : `Acción: ${action}.${ctx}\nBiografía actual:\n"""${input}"""\nReescríbela mejor.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (r.status === 429) {
      return new Response(JSON.stringify({ error: "Demasiadas solicitudes, intenta en un minuto." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (r.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos de IA agotados. Contacta al administrador." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!r.ok) {
      const t = await r.text();
      console.error("AI error:", r.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const j = await r.json();
    let out: string = j?.choices?.[0]?.message?.content ?? "";
    out = out.replace(/^["“”']+|["“”']+$/g, "").trim();
    if (out.length > 500) out = out.slice(0, 497).trimEnd() + "…";

    return new Response(JSON.stringify({ bio: out }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
