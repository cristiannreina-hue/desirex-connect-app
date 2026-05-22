import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const INITIAL: Msg = {
  role: "assistant",
  content:
    "Hola, soy **Aria** 💫 Asistente de DeseoX. Pregúntame sobre **planes**, **verificación**, **seguridad** o cómo **registrarte**.",
};

export const HelpChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([INITIAL]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-help-chat`;
    let assistant = "";
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg].filter(m => m.role !== "assistant" || m !== INITIAL) }),
      });

      if (resp.status === 429) throw new Error("Demasiadas preguntas, espera un minuto.");
      if (resp.status === 402) throw new Error("Servicio sin créditos. Avísanos en support@deseo-x.com.");
      if (!resp.ok || !resp.body) throw new Error("No se pudo conectar con Aria.");

      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const p = JSON.parse(json);
            const delta = p?.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: assistant };
                return copy;
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `⚠️ ${e?.message ?? "Error de conexión"}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Renderizado simple de markdown: negritas, enlaces y saltos
  const renderMd = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    let key = 0;
    const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
    const lines = text.split("\n");
    lines.forEach((line, li) => {
      let last = 0;
      let m;
      const pieces: (string | JSX.Element)[] = [];
      while ((m = linkRe.exec(line)) !== null) {
        if (m.index > last) pieces.push(line.slice(last, m.index));
        pieces.push(
          <a key={`l${key++}`} href={m[2]} className="text-accent underline" target={m[2].startsWith("/") ? "_self" : "_blank"} rel="noreferrer">
            {m[1]}
          </a>
        );
        last = m.index + m[0].length;
      }
      if (last < line.length) pieces.push(line.slice(last));
      const bolded = pieces.map((p, i) =>
        typeof p === "string"
          ? p.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
              seg.startsWith("**") && seg.endsWith("**") ? (
                <strong key={`b${key++}-${i}-${j}`}>{seg.slice(2, -2)}</strong>
              ) : (
                <span key={`s${key++}-${i}-${j}`}>{seg}</span>
              )
            )
          : p
      );
      parts.push(<span key={`ln${key++}`}>{bolded}</span>);
      if (li < lines.length - 1) parts.push(<br key={`br${key++}`} />);
    });
    return parts;
  };

  return (
    <>
      {!open && (
        <button
          aria-label="Abrir asistente de ayuda"
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground px-4 py-3 shadow-elevated hover:scale-[1.03] transition-transform"
        >
          <Bot className="h-5 w-5" />
          <span className="text-sm font-semibold hidden sm:inline">Pregunta a Aria</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-[min(92vw,380px)] h-[min(70vh,560px)] card-premium rounded-3xl shadow-elevated flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent inline-flex items-center justify-center text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Aria · Asistente IA</p>
                <p className="text-[10px] text-muted-foreground">Ayuda sobre DeseoX</p>
              </div>
            </div>
            <button
              aria-label="Cerrar chat"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary text-foreground rounded-bl-sm"
                )}
              >
                {renderMd(m.content || (loading && i === messages.length - 1 ? "…" : ""))}
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="bg-secondary text-muted-foreground rounded-2xl rounded-bl-sm px-3 py-2 text-sm max-w-[60%]">
                Aria está escribiendo…
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="border-t border-border/60 p-2 flex gap-2 bg-background/60"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta…"
              maxLength={500}
              disabled={loading}
              className="bg-background/60"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Enviar">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
};
