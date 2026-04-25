import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { PremiumDialog } from "./PremiumDialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  recipientId: string;
  recipientName: string;
}

const FREE_LIMIT = 1;

export const MessageDialog = ({ open, onOpenChange, recipientId, recipientName }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Conteo de mensajes ya enviados (para regla 1 gratis)
  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", user.id)
      .eq("recipient_id", recipientId)
      .then(({ count }) => setSentCount(count ?? 0));
    setTimeout(() => taRef.current?.focus(), 100);
  }, [open, user, recipientId]);

  if (!user) {
    // No logueado: redirigir desde el botón antes de abrir, pero por seguridad:
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="card-glass max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Inicia sesión</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Necesitas una cuenta para enviar mensajes a {recipientName}.
          </p>
          <Button variant="hero" className="rounded-full" onClick={() => navigate("/auth")}>
            Iniciar sesión
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  const reachedLimit = sentCount >= FREE_LIMIT;

  const handleSend = async () => {
    const text = content.trim();
    if (!text) return;
    if (reachedLimit) {
      setPremiumOpen(true);
      return;
    }
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: recipientId,
      content: text,
    });
    setSending(false);
    if (error) {
      toast.error("No se pudo enviar el mensaje");
      return;
    }
    toast.success(`Mensaje enviado a ${recipientName}`);
    setContent("");
    setSentCount((c) => c + 1);
    onOpenChange(false);
    // Si era el primero gratis, mostrar premium para incentivar
    setTimeout(() => setPremiumOpen(true), 600);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="card-premium max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Mensaje para <span className="text-gradient">{recipientName}</span>
            </DialogTitle>
          </DialogHeader>

          {reachedLimit ? (
            <div className="rounded-2xl bg-secondary/50 ring-1 ring-border p-5 text-center space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold">Activa Premium para continuar</h3>
              <p className="text-sm text-muted-foreground">
                Ya enviaste tu mensaje gratis. Desbloquea conversaciones ilimitadas.
              </p>
              <Button variant="hero" className="rounded-full w-full" onClick={() => setPremiumOpen(true)}>
                Ver Premium
              </Button>
            </div>
          ) : (
            <>
              <Textarea
                ref={taRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Escribe un mensaje breve para ${recipientName}…`}
                rows={5}
                maxLength={500}
                className="rounded-xl bg-background/60 resize-none"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>1 mensaje gratis · {500 - content.length} restantes</span>
              </div>
              <Button
                variant="hero"
                size="lg"
                className="rounded-full w-full"
                disabled={sending || !content.trim()}
                onClick={handleSend}
              >
                <Send className="h-4 w-4" />
                {sending ? "Enviando…" : "Enviar mensaje"}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PremiumDialog
        open={premiumOpen}
        onOpenChange={setPremiumOpen}
        title="Conversaciones ilimitadas"
        reason={`Continúa hablando con ${recipientName} y con quien quieras, sin límites.`}
      />
    </>
  );
};
