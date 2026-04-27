import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COLOMBIA, DEPARTMENTS } from "@/data/colombia";
import { CATEGORY_LABELS, SERVICE_LABELS, type Category, type ServiceType } from "@/types/profile";
import { ImagePlus, Save, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getCompletion } from "@/lib/profile-completion";

interface FormState {
  display_name: string;
  age: string;
  birth_date: string;
  birth_place: string;
  height: string;
  department: string;
  city: string;
  category: Category | "";
  service_type: ServiceType | "";
  description: string;
  photos: string[];
  whatsapp: string;
  telegram: string;
}

const empty: FormState = {
  display_name: "",
  age: "",
  birth_date: "",
  birth_place: "",
  height: "",
  department: "",
  city: "",
  category: "",
  service_type: "",
  description: "",
  photos: [],
  rate_short: "",
  rate_one_hour: "",
  rate_two_hours: "",
  rate_full_day: "",
  whatsapp: "",
  telegram: "",
};

const Register = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Mi perfil · DeseoX";
  }, []);

  // Solo logueados pueden crear/editar
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Cargar perfil existente
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data: p }) => {
        if (p) {
          setData({
            display_name: p.display_name ?? "",
            age: p.age?.toString() ?? "",
            birth_date: p.birth_date ?? "",
            birth_place: p.birth_place ?? "",
            height: p.height?.toString() ?? "",
            department: p.department ?? "",
            city: p.city ?? "",
            category: (p.category as Category) ?? "",
            service_type: (p.service_type as ServiceType) ?? "",
            description: p.description ?? "",
            photos: p.photos ?? [],
            rate_short: p.rate_short?.toString() ?? "",
            rate_one_hour: p.rate_one_hour?.toString() ?? "",
            rate_two_hours: p.rate_two_hours?.toString() ?? "",
            rate_full_day: p.rate_full_day?.toString() ?? "",
            whatsapp: p.whatsapp ?? "",
            telegram: p.telegram ?? "",
          });
        }
        setLoading(false);
      });
  }, [user]);

  const cities = useMemo(
    () => (data.department ? COLOMBIA[data.department] ?? [] : []),
    [data.department],
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const onPhotos = async (files: FileList | null) => {
    if (!files || !user) return;
    const remaining = 6 - data.photos.length;
    const picked = Array.from(files).slice(0, remaining);
    const uploaded: string[] = [];

    for (const file of picked) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("profile-photos").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        toast.error(`Error subiendo ${file.name}: ${error.message}`);
        continue;
      }
      const { data: pub } = supabase.storage.from("profile-photos").getPublicUrl(path);
      uploaded.push(pub.publicUrl);
    }

    if (uploaded.length) {
      update("photos", [...data.photos, ...uploaded]);
      toast.success(`${uploaded.length} foto(s) subidas`);
    }
  };

  const removePhoto = (i: number) =>
    update("photos", data.photos.filter((_, j) => j !== i));

  const completion = useMemo(() => {
    const draft = {
      display_name: data.display_name,
      age: data.age ? parseInt(data.age) : null,
      department: data.department,
      city: data.city,
      category: data.category,
      service_type: data.service_type,
      description: data.description,
      photos: data.photos,
      rate_short: data.rate_short ? parseInt(data.rate_short) : null,
      rate_one_hour: data.rate_one_hour ? parseInt(data.rate_one_hour) : null,
      rate_two_hours: data.rate_two_hours ? parseInt(data.rate_two_hours) : null,
      rate_full_day: data.rate_full_day ? parseInt(data.rate_full_day) : null,
      whatsapp: data.whatsapp,
      telegram: data.telegram,
    };
    return getCompletion(draft as any);
  }, [data]);

  const save = async () => {
    if (!user) return;
    if (data.age && parseInt(data.age) < 18) {
      toast.error("Debes ser mayor de 18 años");
      return;
    }
    setSaving(true);
    const payload = {
      id: user.id,
      display_name: data.display_name || null,
      age: data.age ? parseInt(data.age) : null,
      birth_date: data.birth_date || null,
      birth_place: data.birth_place || null,
      height: data.height ? parseInt(data.height) : null,
      department: data.department || null,
      city: data.city || null,
      category: data.category || null,
      service_type: data.service_type || null,
      description: data.description || null,
      photos: data.photos,
      rate_short: data.rate_short ? parseInt(data.rate_short) : null,
      rate_one_hour: data.rate_one_hour ? parseInt(data.rate_one_hour) : null,
      rate_two_hours: data.rate_two_hours ? parseInt(data.rate_two_hours) : null,
      rate_full_day: data.rate_full_day ? parseInt(data.rate_full_day) : null,
      whatsapp: data.whatsapp || null,
      telegram: data.telegram || null,
    };
    const { error } = await supabase.from("profiles").upsert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      completion.isComplete
        ? "¡Perfil guardado y publicado!"
        : "Cambios guardados. Completa los campos faltantes para publicarlo.",
    );
    navigate("/cuenta");
  };

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container flex-1 py-20 text-center text-muted-foreground">Cargando…</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-extrabold">
              {completion.isComplete ? "Edita tu perfil" : "Completa tu perfil"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {completion.isComplete
                ? "Tu perfil está publicado en DeseoX."
                : "Completa todos los campos para que tu perfil sea visible."}
            </p>
          </div>

          {/* Progreso */}
          <div className="card-glass rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display font-bold text-sm inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent" />
                {completion.percent}% completado
              </p>
              <span
                className={cn(
                  "text-xs rounded-full px-2.5 py-0.5 ring-1",
                  completion.isComplete
                    ? "bg-success/15 text-success ring-success/40"
                    : "bg-accent/10 text-accent ring-accent/40",
                )}
              >
                {completion.isComplete ? "✓ Visible públicamente" : "Privado · solo tú lo ves"}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-gradient-primary transition-all duration-500"
                style={{ width: `${completion.percent}%` }}
              />
            </div>
            {completion.missing.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {completion.missing.map((m) => (
                  <span
                    key={m.key}
                    className="text-[11px] rounded-full px-2 py-0.5 bg-secondary text-muted-foreground ring-1 ring-border"
                  >
                    Falta: {m.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Section title="Datos personales">
            <Field label="Nombre o alias">
              <Input
                value={data.display_name}
                onChange={(e) => update("display_name", e.target.value)}
                placeholder="Ej: Valentina"
                maxLength={40}
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Edad">
                <Input
                  type="number"
                  min={18}
                  max={99}
                  value={data.age}
                  onChange={(e) => update("age", e.target.value)}
                  placeholder="24"
                />
              </Field>
              <Field label="Fecha de nacimiento">
                <Input
                  type="date"
                  value={data.birth_date}
                  onChange={(e) => update("birth_date", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Lugar de nacimiento">
              <Input
                value={data.birth_place}
                onChange={(e) => update("birth_place", e.target.value)}
                placeholder="Medellín, Colombia"
              />
            </Field>
            <Field label="Altura (cm)">
              <Input
                type="number"
                min={120}
                max={220}
                value={data.height}
                onChange={(e) => update("height", e.target.value)}
                placeholder="170"
              />
            </Field>
          </Section>

          <Section title="Ubicación">
            <Field label="País">
              <Input value="Colombia" disabled />
            </Field>
            <Field label="Departamento">
              <Select
                value={data.department}
                onValueChange={(v) => {
                  update("department", v);
                  update("city", "");
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecciona departamento" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Ciudad / Municipio">
              <Select value={data.city} onValueChange={(v) => update("city", v)} disabled={!data.department}>
                <SelectTrigger>
                  <SelectValue placeholder={data.department ? "Selecciona ciudad" : "Elige primero el departamento"} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Section>

          <Section title="Categoría y descripción">
            <Field label="Categoría">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([k, label]) => (
                  <Pill key={k} active={data.category === k} onClick={() => update("category", k)}>
                    {label}
                  </Pill>
                ))}
              </div>
            </Field>
            <Field label="Tipo de servicio">
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(SERVICE_LABELS) as [ServiceType, string][]).map(([k, label]) => (
                  <Pill key={k} active={data.service_type === k} onClick={() => update("service_type", k)}>
                    {label}
                  </Pill>
                ))}
              </div>
            </Field>
            <Field label={`Descripción (${data.description.length}/500 · mín. 40)`}>
              <Textarea
                value={data.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Cuéntale al mundo cómo eres..."
                rows={4}
                maxLength={500}
              />
            </Field>
          </Section>

          <Section title={`Fotos (mínimo 3 · ${data.photos.length}/6)`}>
            <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background/40 p-8 cursor-pointer hover:border-accent/60 hover:bg-accent/5 transition-colors">
              <ImagePlus className="h-8 w-8 text-accent" />
              <span className="text-sm">Toca para subir tus fotos</span>
              <span className="text-xs text-muted-foreground">JPG / PNG · hasta 6 fotos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onPhotos(e.target.files)}
              />
            </label>
            {data.photos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {data.photos.map((src, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={src}
                      alt={`Foto ${i + 1}`}
                      className="aspect-square w-full object-cover rounded-xl ring-1 ring-border"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 rounded-full bg-background/80 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Quitar foto"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Contacto">
            <p className="text-sm text-muted-foreground">
              Estos contactos serán visibles en tu perfil público.
            </p>
            <Field label="WhatsApp (con código de país, sin +)">
              <Input
                value={data.whatsapp}
                onChange={(e) => update("whatsapp", e.target.value.replace(/[^\d]/g, ""))}
                placeholder="573001234567"
                inputMode="numeric"
              />
            </Field>
            <Field label="Usuario de Telegram (sin @)">
              <Input
                value={data.telegram}
                onChange={(e) => update("telegram", e.target.value.replace(/[^\w]/g, ""))}
                placeholder="usuario_tg"
              />
            </Field>
          </Section>

          <div className="sticky bottom-4 z-10">
            <Button
              variant="hero"
              size="lg"
              onClick={save}
              disabled={saving}
              className="w-full rounded-full gap-2 shadow-elevated"
            >
              <Save className="h-4 w-4" />
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="card-glass rounded-3xl p-5 sm:p-7 space-y-5">
    <h2 className="font-display text-lg font-bold">{title}</h2>
    {children}
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm">{label}</Label>
    {children}
  </div>
);

const Pill = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-xl px-3 py-2.5 text-sm font-medium ring-1 transition-all",
      active
        ? "bg-gradient-primary text-primary-foreground ring-transparent shadow-glow-soft"
        : "bg-secondary text-foreground ring-border hover:ring-accent/50",
    )}
  >
    {children}
  </button>
);

export default Register;
