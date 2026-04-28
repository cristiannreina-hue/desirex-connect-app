import { Settings, Globe, Wrench, Languages } from "lucide-react";

export const AdminSettings = () => {
  return (
    <div className="space-y-4">
      <div className="card-glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
            <Settings className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display font-bold">Configuración global</h3>
            <p className="text-xs text-muted-foreground">Ajustes generales de la plataforma</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/60 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Languages className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Idiomas</p>
            </div>
            <p className="text-xs text-muted-foreground">UI multilenguaje (ES/EN/PT) + traducción automática de descripciones activa.</p>
          </div>

          <div className="rounded-xl border border-border/60 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">SEO / Indexación</p>
            </div>
            <p className="text-xs text-muted-foreground">Robots.txt configurado · perfiles privados con noindex.</p>
          </div>

          <div className="rounded-xl border border-border/60 p-4 sm:col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="h-4 w-4 text-amber-400" />
              <p className="text-sm font-semibold">Modo mantenimiento</p>
            </div>
            <p className="text-xs text-muted-foreground">Próximamente: programar ventanas de mantenimiento sin afectar a los usuarios activos.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
