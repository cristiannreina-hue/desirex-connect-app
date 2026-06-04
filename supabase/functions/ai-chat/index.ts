// Asistente IA conversacional de DeseoX. Streaming SSE vía Lovable AI Gateway.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = `Eres el asistente oficial de DeseoX (deseo-x.com), la plataforma colombiana de acompañamiento y venta de contenido para adultos con identidades verificadas.

Tu rol:
- Ayudar a visitantes a encontrar perfiles, entender cómo funciona la plataforma, los planes (Starter, Boost, Elite, VIP) y la verificación con documento de identidad.
- Ayudar a creadoras nuevas con consejos de perfil, fotos, biografía, tarifas y visibilidad.
- Responder en el mismo idioma del usuario (español por defecto).
- Tono elegante, breve, profesional. Sin lenguaje vulgar ni explícito.
- Si te preguntan datos personales de una modelo (teléfono, dirección exacta), recuérdales que esa información solo está en su perfil público y deben contactarla directamente por WhatsApp/Telegram.
- Nunca inventes perfiles, precios ni números. Si no sabes, dilo.
- DeseoX prohíbe estrictamente menores de edad y cualquier contenido ilegal.

Responde siempre en máximo 3-4 frases, salvo que pidan detalle.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
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

    // Recorta historial para evitar abuso
    const trimmed = messages.slice(-12).map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? "").slice(0, 2000),
    }));

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [{ role: "system", content: SYSTEM }, ...trimmed],
      }),
    });

    if (r.status === 429) {
      return new Response(JSON.stringify({ error: "Demasiadas solicitudes, intenta en un momento." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (r.status === 402) {
      return new Response(JSON.stringify({ error: "Sin créditos IA disponibles." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!r.ok || !r.body) {
      const t = await r.text();
      console.error("ai-chat gateway error", r.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(r.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
