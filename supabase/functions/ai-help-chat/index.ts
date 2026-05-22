// Chatbot de ayuda para visitantes de DeseoX. Responde sobre planes,
// verificación, seguridad, contacto, y guía hacia las rutas correctas.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres "Aria", asistente virtual de DeseoX (deseo-x.com), una plataforma legal colombiana de acompañamiento adulto solo +18.

Conoce la plataforma:
- Visitantes: pueden registrarse gratis, ver perfiles públicos, dejar reseñas y contactar por WhatsApp/Telegram.
- Creadoras: deben verificarse con cédula (KYC) y selfie. Sin verificación NO aparecen.
- Planes para creadoras:
  • Starter (gratis 90 días de prueba): 2 fotos públicas + 2 privadas.
  • Boost: 4 públicas + 4 privadas + 1 video.
  • Elite: 7 públicas + 7 privadas + 2 videos.
  • VIP: 11 públicas + 11 privadas + 5 videos, destacado prioritario.
- Pago vía Wompi (Colombia).
- Recompensas semanales: top 3 de visitas/reseñas reciben días extra; 3 semanas seguidas = +1 mes gratis.
- Seguridad: cifrado en tránsito/reposo, RLS por roles, KYC se purga tras aprobación, derechos Habeas Data (Ley 1581/2012). Contacto privacidad@deseo-x.com.
- Edad mínima: 18 años, verificada por fecha de nacimiento al registro.
- Pincel de Privacidad: editor que difumina rostro/zonas antes de publicar fotos.
- Soporte: support@deseo-x.com.

Rutas útiles (sugiérelas con enlaces markdown):
- Registro: /registro
- Iniciar sesión: /auth
- Planes: /planes
- Verificación: /verificacion
- Política de privacidad: /legal/privacidad
- Términos: /legal/terminos

Reglas:
- Responde en español, breve (máx 4 frases), tono cálido y profesional.
- NUNCA generes contenido sexual explícito, ni recomiendes personas específicas.
- Si el usuario pide algo ilegal, prohibido o de menores, recházalo educadamente y recuerda que la plataforma es solo +18.
- Si no sabes algo, dilo y sugiere escribir a support@deseo-x.com.
- Usa markdown con enlaces relativos cuando ayude a navegar.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const cleaned = messages
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-12)
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...cleaned],
        stream: true,
      }),
    });

    if (r.status === 429) {
      return new Response(JSON.stringify({ error: "Demasiadas preguntas, intenta en un minuto." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (r.status === 402) {
      return new Response(JSON.stringify({ error: "Servicio de IA sin créditos. Avísanos por support@deseo-x.com." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!r.ok || !r.body) {
      const t = await r.text().catch(() => "");
      console.error("AI error", r.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(r.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
