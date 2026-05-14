import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { z } from "zod";

const GOLD = "#D4AF37";

const schema = z.string().trim().min(3).max(120).refine((v) => {
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = /^[+]?\d[\d\s\-()]{6,}$/.test(v);
  return isEmail || isPhone;
}, { message: "Ingresa un email válido o tu WhatsApp" });

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  source?: string;
}

export function PreLaunchModal({ open, onOpenChange, source }: Props) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const parsed = schema.safeParse(value);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    const v = parsed.data;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    setLoading(true);
    const { error } = await supabase.from("leads_lanzamiento").insert({
      contact: v,
      contact_type: isEmail ? "email" : "whatsapp",
      source: source ?? "pre_launch_modal",
    });
    setLoading(false);
    if (error) { toast.error("No pudimos guardar tu registro. Intenta de nuevo."); return; }
    setDone(true);
    toast.success("¡Listo! Te avisaremos el 15 de junio.");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setDone(false); setValue(""); } }}>
      <DialogContent className="max-w-md border-white/10 bg-black/80 backdrop-blur-2xl">
        <DialogHeader>
          <div className="mx-auto mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-widest"
               style={{ borderColor: `${GOLD}55`, color: GOLD }}>
            <Sparkles className="h-3.5 w-3.5" /> Pre-Lanzamiento
          </div>
          <DialogTitle className="text-center text-2xl font-display" style={{ color: GOLD }}>
            ¡El Deseo está a punto de liberarse!
          </DialogTitle>
          <DialogDescription className="text-center text-white/80">
            El contacto directo con nuestras modelos se habilitará oficialmente el <strong>15 de junio</strong>. No seas el último en enterarte.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="text-center py-4 text-white/85">
            Te avisaremos en <strong style={{ color: GOLD }}>{value}</strong>.
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <Input
              autoFocus
              placeholder="Tu WhatsApp o email"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              className="bg-white/5 border-white/15 text-white placeholder:text-white/40"
              maxLength={120}
            />
            <Button
              onClick={submit}
              disabled={loading}
              className="w-full rounded-full font-bold"
              style={{ background: GOLD, color: "#0A0A0A" }}
            >
              {loading ? "Guardando..." : "Avísenme cuando abra"}
            </Button>
            <p className="text-[11px] text-white/50 text-center">
              Solo lo usaremos para notificarte el lanzamiento.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
