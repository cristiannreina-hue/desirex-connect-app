import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Globe, Wrench, Languages, Save, UserPlus, CalendarClock, MessageCircleOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { refreshSiteSettings } from "@/hooks/useSiteSettings";

interface SettingsRow {
  maintenance_mode: boolean;
  maintenance_message: string | null;
  launch_date: string | null;
  signups_open: boolean;
  hide_whatsapp_public: boolean;
}


const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const AdminSettings = () => {
  const [s, setS] = useState<SettingsRow>({
    maintenance_mode: false,
    maintenance_message: "",
    launch_date: null,
    signups_open: true,
    hide_whatsapp_public: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("maintenance_mode,maintenance_message,launch_date,signups_open,hide_whatsapp_public")

        .eq("id", true)
        .maybeSingle();
      if (data) setS(data as SettingsRow);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("site_settings")
      .update({
        maintenance_mode: s.maintenance_mode,
        maintenance_message: s.maintenance_message?.trim() || null,
        launch_date: s.launch_date,
        signups_open: s.signups_open,
        hide_whatsapp_public: s.hide_whatsapp_public,
        updated_by: user?.id ?? null,
      } as any)
      .eq("id", true);

    setSaving(false);
    if (error) return toast.error(error.message);
    await refreshSiteSettings();
    toast.success("Configuración guardada y aplicada en el sitio");
  };

  if (loading) {
    return <p className="card-glass rounded-2xl p-6 text-center text-sm text-muted-foreground">Cargando…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="card-glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
            <Settings className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display font-bold">Configuración global</h3>
            <p className="text-xs text-muted-foreground">Controla en vivo el comportamiento del sitio</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Maintenance */}
          <div className="rounded-xl border border-border/60 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-amber-400" />
                <div>
                  <p className="text-sm font-semibold">Modo mantenimiento</p>
                  <p className="text-xs text-muted-foreground">Muestra un banner amarillo a todos los visitantes.</p>
                </div>
              </div>
              <Switch
                checked={s.maintenance_mode}
                onCheckedChange={(v) => setS({ ...s, maintenance_mode: v })}
              />
            </div>
            <Textarea
              placeholder="Mensaje opcional (ej: Volvemos en 30 minutos)…"
              value={s.maintenance_message ?? ""}
              onChange={(e) => setS({ ...s, maintenance_message: e.target.value })}
              maxLength={200}
              rows={2}
            />
          </div>

          {/* Signups */}
          <div className="rounded-xl border border-border/60 p-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">Registros abiertos</p>
                <p className="text-xs text-muted-foreground">Permite nuevos registros de creadoras y clientes.</p>
              </div>
            </div>
            <Switch
              checked={s.signups_open}
              onCheckedChange={(v) => setS({ ...s, signups_open: v })}
            />
          </div>

          {/* Launch date */}
          <div className="rounded-xl border border-border/60 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">Fecha de lanzamiento</p>
                <p className="text-xs text-muted-foreground">Fin del pre-launch / cuenta regresiva.</p>
              </div>
            </div>
            <Input
              type="datetime-local"
              value={toLocalInput(s.launch_date)}
              onChange={(e) =>
                setS({ ...s, launch_date: e.target.value ? new Date(e.target.value).toISOString() : null })
              }
            />
          </div>

          {/* Info-only */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/60 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Languages className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Idiomas</p>
              </div>
              <p className="text-xs text-muted-foreground">UI multilenguaje (ES/EN/PT) + traducción automática activa.</p>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">SEO / Indexación</p>
              </div>
              <p className="text-xs text-muted-foreground">Robots.txt configurado · perfiles privados con noindex.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <Button onClick={save} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
};
