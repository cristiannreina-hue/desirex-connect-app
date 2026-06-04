import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const SUGGESTIONS = [
  "¿Cómo funciona la verificación?",
  "¿Qué planes hay para creadoras?",
  "Recomiéndame modelos en Medellín",
];

export const FloatingAiChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || loading) return;
    const userMsg: Msg = { role: "user", content: clean };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}` },
        body: JSON.stringify({ messages: next }),
      });
      if (!resp.ok || !resp.body) {
        const j = await resp.json().catch(() => ({}));
        setMessages((p) => [...p, { role: "assistant", content: j.error || "Hubo un problema. Intenta de nuevo." }]);
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      setMessages((p) => [...p, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages((p) => {
                const copy = [...p];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      setMessages((p) => [...p, { role: "assistant", content: "Sin conexión con el asistente." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        aria-label="Abrir asistente IA"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed z-[80] bottom-24 right-4 md:bottom-6 md:right-6 h-14 w-14 rounded-full",
          "bg-gradient-to-br from-accent to-primary text-primary-foreground",
          "shadow-[0_10px_40px_-10px_hsl(var(--accent)/0.8)] ring-2 ring-accent/40",
          "flex items-center justify-center transition-transform hover:scale-105 active:scale-95",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          className={cn(
            "fixed z-[79] bottom-44 right-4 md:bottom-24 md:right-6",
            "w-[calc(100vw-2rem)] max-w-sm h-[70vh] max-h-[560px]",
            "rounded-2xl bg-background/95 backdrop-blur-xl ring-1 ring-border shadow-2xl",
            "flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4",
          )}
        >
          <header className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-gradient-to-r from-accent/10 to-transparent">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent">
              <Bot className="h-4 w-4" />
            </span>
            <div className="flex-1 leading-tight">
              <p className="text-sm font-bold">Asistente DeseoX</p>
              <p className="text-[10px] text-muted-foreground">Respuestas con IA · 24/7</p>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground px-1">
                  Hola 👋 Soy el asistente de DeseoX. ¿En qué te ayudo?
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-xs rounded-xl px-3 py-2 bg-secondary/60 hover:bg-secondary ring-1 ring-border transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "ml-auto bg-accent text-accent-foreground rounded-br-md"
                    : "mr-auto bg-secondary text-foreground rounded-bl-md",
                )}
              >
                {m.content || (loading && i === messages.length - 1 ? "…" : "")}
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="mr-auto inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Pensando…
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="border-t border-border/60 p-2 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta…"
              maxLength={500}
              className="flex-1 h-10 rounded-full bg-secondary/60 px-4 text-sm outline-none ring-1 ring-border focus:ring-accent/60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Enviar"
              className="h-10 w-10 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center disabled:opacity-40 hover:scale-105 transition"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
