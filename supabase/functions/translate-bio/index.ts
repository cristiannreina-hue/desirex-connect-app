// Traduce textos cortos (descripciones de perfil) entre ES y EN usando Lovable AI Gateway.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { text, target } = await req.json();
    if (!text || !target) {
      return new Response(JSON.stringify({ error: "text and target required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const lang = target === "en" ? "English" : "Spanish";
    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Translate the following profile description into ${lang}. Keep tone natural, concise and respectful. Return ONLY the translation, no quotes.`,
          },
          { role: "user", content: String(text).slice(0, 1500) },
        ],
      }),
    });
    if (r.status === 429 || r.status === 402) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: r.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const j = await r.json();
    const translation = j?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ translation }), {
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
