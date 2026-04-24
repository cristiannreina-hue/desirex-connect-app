import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { ArrowLeft, ArrowRight, CheckCircle2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FormState {
  name: string;
  age: string;
  birthDate: string;
  birthPlace: string;
  height: string;
  department: string;
  city: string;
  category: Category | "";
  serviceType: ServiceType | "";
  photos: string[]; // data URLs
  rateShort: string;
  rateOneHour: string;
  rateTwoHours: string;
  rateFullDay: string;
  description: string;
  whatsapp: string;
  telegram: string;
}

const empty: FormState = {
  name: "",
  age: "",
  birthDate: "",
  birthPlace: "",
  height: "",
  department: "",
  city: "",
  category: "",
  serviceType: "",
  photos: [],
  rateShort: "",
  rateOneHour: "",
  rateTwoHours: "",
  rateFullDay: "",
  description: "",
  whatsapp: "",
  telegram: "",
};

const STEPS = ["Datos", "Ubicación", "Categoría", "Fotos", "Tarifas", "Contacto"];

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormState>(empty);
  const [done, setDone] = useState(false);

  const cities = useMemo(
    () => (data.department ? COLOMBIA[data.department] ?? [] : []),
    [data.department],
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const onPhotos = (files: FileList | null) => {
    if (!files) return;
    const remaining = 6 - data.photos.length;
    const picked = Array.from(files).slice(0, remaining);
    const readers = picked.map(
      (file) =>
        new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.readAsDataURL(file);
        }),
    );
    Promise.all(readers).then((urls) => update("photos", [...data.photos, ...urls]));
  };

  const stepValid = (): true | string => {
    switch (step) {
      case 0:
        if (!data.name.trim()) return "Ingresa tu nombre o alias";
        if (!data.age || +data.age < 18) return "Debes ser mayor de 18 años";
        if (!data.birthDate) return "Indica tu fecha de nacimiento";
        if (!data.birthPlace.trim()) return "Indica tu lugar de nacimiento";
        if (!data.height || +data.height < 100) return "Ingresa una altura válida";
        return true;
      case 1:
        if (!data.department) return "Selecciona departamento";
        if (!data.city) return "Selecciona ciudad";
        return true;
      case 2:
        if (!data.category) return "Elige una categoría";
        if (!data.serviceType) return "Elige el tipo de servicio";
        return true;
      case 3:
        if (data.photos.length < 3) return "Sube al menos 3 fotos";
        return true;
      case 4:
        if (!data.rateOneHour) return "Indica al menos la tarifa de 1 hora";
        return true;
      case 5:
        if (!data.whatsapp.trim()) return "Ingresa tu WhatsApp";
        if (!data.telegram.trim()) return "Ingresa tu usuario de Telegram";
        return true;
      default:
        return true;
    }
  };

  const next = () => {
    const v = stepValid();
    if (v !== true) {
      toast.error(v);
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else submit();
  };

  const submit = () => {
    setDone(true);
    toast.success("¡Perfil creado con éxito!");
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container flex-1 flex items-center justify-center py-16">
          <div className="card-glass max-w-md w-full rounded-3xl p-8 text-center shadow-glow-soft animate-scale-in">
            <div className="mx-auto mb-4 inline-flex rounded-full bg-success/15 p-4 ring-1 ring-success/40">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h1 className="font-display text-2xl font-bold">¡Tu perfil fue creado!</h1>
            <p className="mt-2 text-muted-foreground text-sm">
              En la versión final tu perfil quedará publicado y visible para todos los usuarios.
              Esta es una vista previa de demostración.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button asChild variant="outline" className="flex-1">
                <Link to="/">Ir a explorar</Link>
              </Button>
              <Button
                variant="hero"
                className="flex-1"
                onClick={() => {
                  setData(empty);
                  setStep(0);
                  setDone(false);
                }}
              >
                Crear otro
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="container flex-1 py-8">
        <div className="max-w-2xl mx-auto">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-4">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Volver
            </Link>
          </Button>

          <div className="mb-6">
            <h1 className="font-display text-3xl md:text-4xl font-extrabold">
              Crea tu perfil en <span className="text-gradient">DeseoX</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Paso {step + 1} de {STEPS.length} · {STEPS[step]}
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-gradient-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className={cn(
                    "text-[11px] rounded-full px-2 py-0.5 ring-1",
                    i === step
                      ? "bg-accent/15 text-accent ring-accent/40"
                      : i < step
                        ? "bg-secondary text-foreground/80 ring-border"
                        : "bg-transparent text-muted-foreground ring-border/60",
                  )}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="card-glass rounded-3xl p-5 sm:p-7 space-y-5 animate-fade-in">
            {step === 0 && (
              <>
                <Field label="Nombre o alias">
                  <Input value={data.name} onChange={(e) => update("name", e.target.value)} placeholder="Ej: Valentina" maxLength={40} />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Edad">
                    <Input type="number" min={18} max={99} value={data.age} onChange={(e) => update("age", e.target.value)} placeholder="24" />
                  </Field>
                  <Field label="Fecha de nacimiento">
                    <Input type="date" value={data.birthDate} onChange={(e) => update("birthDate", e.target.value)} />
                  </Field>
                </div>
                <Field label="Lugar de nacimiento">
                  <Input value={data.birthPlace} onChange={(e) => update("birthPlace", e.target.value)} placeholder="Medellín, Colombia" />
                </Field>
                <Field label="Altura (cm)">
                  <Input type="number" min={120} max={220} value={data.height} onChange={(e) => update("height", e.target.value)} placeholder="170" />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="País">
                  <Input value="Colombia" disabled />
                </Field>
                <Field label="Departamento">
                  <Select value={data.department} onValueChange={(v) => { update("department", v); update("city", ""); }}>
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
                    <SelectTrigger><SelectValue placeholder={data.department ? "Selecciona ciudad" : "Elige primero el departamento"} /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {cities.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Categoría">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([k, label]) => (
                      <Pill key={k} active={data.category === k} onClick={() => update("category", k)}>{label}</Pill>
                    ))}
                  </div>
                </Field>
                <Field label="Tipo de servicio">
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(SERVICE_LABELS) as [ServiceType, string][]).map(([k, label]) => (
                      <Pill key={k} active={data.serviceType === k} onClick={() => update("serviceType", k)}>{label}</Pill>
                    ))}
                  </div>
                </Field>
                <Field label="Descripción (opcional)">
                  <Textarea
                    value={data.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Cuéntale al mundo cómo eres..."
                    rows={4}
                    maxLength={500}
                  />
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <Field label={`Fotos (mínimo 3 · ${data.photos.length}/6)`}>
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
                          <img src={src} alt={`Foto ${i + 1}`} className="aspect-square w-full object-cover rounded-xl ring-1 ring-border" />
                          <button
                            type="button"
                            onClick={() => update("photos", data.photos.filter((_, j) => j !== i))}
                            className="absolute top-1 right-1 rounded-full bg-background/80 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Quitar foto"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Field>
              </>
            )}

            {step === 4 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Configura tus precios en pesos colombianos. Solo se mostrarán los que llenes.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Sesión corta (COP)">
                    <Input type="number" min={0} value={data.rateShort} onChange={(e) => update("rateShort", e.target.value)} placeholder="150000" />
                  </Field>
                  <Field label="1 hora (COP)">
                    <Input type="number" min={0} value={data.rateOneHour} onChange={(e) => update("rateOneHour", e.target.value)} placeholder="250000" />
                  </Field>
                  <Field label="2 horas (COP)">
                    <Input type="number" min={0} value={data.rateTwoHours} onChange={(e) => update("rateTwoHours", e.target.value)} placeholder="450000" />
                  </Field>
                  <Field label="Jornada completa (COP)">
                    <Input type="number" min={0} value={data.rateFullDay} onChange={(e) => update("rateFullDay", e.target.value)} placeholder="1500000" />
                  </Field>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Estos contactos serán visibles públicamente en tu perfil.
                </p>
                <Field label="WhatsApp (con código de país)">
                  <Input
                    value={data.whatsapp}
                    onChange={(e) => update("whatsapp", e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="573001234567"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="Usuario de Telegram (sin @)">
                  <Input value={data.telegram} onChange={(e) => update("telegram", e.target.value.replace(/[^\w]/g, ""))} placeholder="usuario_tg" />
                </Field>
              </>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => (step > 0 ? setStep(step - 1) : navigate("/"))}
                className="gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                {step > 0 ? "Atrás" : "Cancelar"}
              </Button>
              <Button variant="hero" size="lg" onClick={next} className="gap-1">
                {step < STEPS.length - 1 ? (
                  <>
                    Siguiente <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  "Crear perfil"
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

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
