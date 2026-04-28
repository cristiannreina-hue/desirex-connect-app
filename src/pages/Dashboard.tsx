import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { COLOMBIA, DEPARTMENTS } from "@/data/colombia";
import { CATEGORY_LABELS, SERVICE_LABELS, type Category, type ServiceType } from "@/types/profile";
import { ImagePlus, Save, X, ShieldCheck, Crown, Lock, Video, BadgeCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SeoNoIndex } from "@/components/SeoNoIndex";
import { useI18n } from "@/lib/i18n";

interface FormState {
  display_name: string;
  nickname: string;
  age: string;
  birth_date: string;
  birth_place: string;
  height: string;
  weight: string;
  hair_color: string;
  measurements: string;
  department: string;
  city: string;
  work_zone: string;
  category: Category | "";
  service_type: ServiceType | "";
  description: string;
  public_photos: string[];
  exclusive_photos: string[]; // storage paths
  exclusive_videos: string[]; // storage paths
  whatsapp: string;
  telegram: string;
  account_type: "visitor" | "creator";
  verification_status: string;
  is_verified: boolean;
}

const empty: FormState = {
  display_name: "", nickname: "", age: "", birth_date: "", birth_place: "",
  height: "", weight: "", hair_color: "", measurements: "",
  department: "", city: "", work_zone: "",
  category: "", service_type: "", description: "",
  public_photos: [], exclusive_photos: [], exclusive_videos: [],
  whatsapp: "", telegram: "",
  account_type: "creator", verification_status: "unverified", is_verified: false,
};

const PUBLIC_PHOTO_LIMIT = 3;
const EXCLUSIVE_PHOTO_LIMIT_BY_TIER: Record<string, number> = {
  starter: 6, boost: 12, elite: 24, vip: 48,
};
const EXCLUSIVE_VIDEO_LIMIT_BY_TIER: Record<string, number> = {
  starter: 2, boost: 5, elite: 10, vip: 20,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [data, setData] = useState<FormState>(empty);
  const [tier, setTier] = useState<string>("starter");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Panel de creador · DeseoX"; }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("tier, status, expires_at")
        .eq("user_id", user.id)
        .order("expires_at", { ascending: false }).limit(1).maybeSingle(),
    ]).then(([{ data: p }, { data: sub }]) => {
      if (p) {
        const anyP = p as any;
        setData({
          display_name: p.display_name ?? "",
          nickname: anyP.nickname ?? "",
          age: p.age?.toString() ?? "",
          birth_date: p.birth_date ?? "",
          birth_place: p.birth_place ?? "",
          height: p.height?.toString() ?? "",
          weight: anyP.weight?.toString() ?? "",
          hair_color: anyP.hair_color ?? "",
          measurements: anyP.measurements ?? "",
          department: p.department ?? "",
          city: p.city ?? "",
          work_zone: anyP.work_zone ?? "",
          category: (p.category as Category) ?? "",
          service_type: (p.service_type as ServiceType) ?? "",
          description: p.description ?? "",
          public_photos: anyP.public_photos?.length ? anyP.public_photos : (p.photos ?? []).slice(0, PUBLIC_PHOTO_LIMIT),
          exclusive_photos: anyP.exclusive_photos ?? [],
          exclusive_videos: anyP.exclusive_videos ?? [],
          whatsapp: p.whatsapp ?? "",
          telegram: p.telegram ?? "",
          account_type: (anyP.account_type ?? "creator") as any,
          verification_status: p.verification_status ?? "unverified",
          is_verified: p.is_verified ?? false,
        });
      }
      if (sub) setTier(sub.tier as string);
      setLoading(false);
    });
  }, [user]);

  const cities = useMemo(
    () => (data.department ? COLOMBIA[data.department] ?? [] : []),
    [data.department],
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const exclusivePhotoLimit = EXCLUSIVE_PHOTO_LIMIT_BY_TIER[tier] ?? 6;
  const exclusiveVideoLimit = EXCLUSIVE_VIDEO_LIMIT_BY_TIER[tier] ?? 2;

  // Subir fotos públicas (bucket público)
  const onPublicPhotos = async (files: FileList | null) => {
    if (!files || !user) return;
    const remaining = PUBLIC_PHOTO_LIMIT - data.public_photos.length;
    const picked = Array.from(files).slice(0, remaining);
    const uploaded: string[] = [];
    for (const file of picked) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/public-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: false });
      if (error) { toast.error(error.message); continue; }
      const { data: pub } = supabase.storage.from("profile-photos").getPublicUrl(path);
      uploaded.push(pub.publicUrl);
    }
    if (uploaded.length) {
      update("public_photos", [...data.public_photos, ...uploaded]);
      toast.success(`${uploaded.length} foto(s) públicas subidas`);
    }
  };

  // Subir fotos exclusivas (bucket privado)
  const onExclusivePhotos = async (files: FileList | null) => {
    if (!files || !user) return;
    const remaining = exclusivePhotoLimit - data.exclusive_photos.length;
    const picked = Array.from(files).slice(0, remaining);
    const uploaded: string[] = [];
    for (const file of picked) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("exclusive-media").upload(path, file, { upsert: false });
      if (error) { toast.error(error.message); continue; }
      uploaded.push(path);
    }
    if (uploaded.length) {
      update("exclusive_photos", [...data.exclusive_photos, ...uploaded]);
      toast.success(`${uploaded.length} foto(s) exclusivas subidas`);
    }
  };

  // Subir videos exclusivos
  const onExclusiveVideos = async (files: FileList | null) => {
    if (!files || !user) return;
    const remaining = exclusiveVideoLimit - data.exclusive_videos.length;
    const picked = Array.from(files).slice(0, remaining);
    const uploaded: string[] = [];
    for (const file of picked) {
      const ext = file.name.split(".").pop() ?? "mp4";
      const path = `${user.id}/videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("exclusive-media").upload(path, file, { upsert: false });
      if (error) { toast.error(error.message); continue; }
      uploaded.push(path);
    }
    if (uploaded.length) {
      update("exclusive_videos", [...data.exclusive_videos, ...uploaded]);
      toast.success(`${uploaded.length} video(s) exclusivos subidos`);
    }
  };

  const removePublic = (i: number) =>
    update("public_photos", data.public_photos.filter((_, j) => j !== i));
  const removeExclPhoto = async (i: number) => {
    const path = data.exclusive_photos[i];
    await supabase.storage.from("exclusive-media").remove([path]);
    update("exclusive_photos", data.exclusive_photos.filter((_, j) => j !== i));
  };
  const removeExclVideo = async (i: number) => {
    const path = data.exclusive_videos[i];
    await supabase.storage.from("exclusive-media").remove([path]);
    update("exclusive_videos", data.exclusive_videos.filter((_, j) => j !== i));
  };

  const save = async () => {
    if (!user) return;
    if (data.age && parseInt(data.age) < 18) { toast.error("Debes ser mayor de 18 años"); return; }
    setSaving(true);
    const payload: any = {
      id: user.id,
      display_name: data.display_name || null,
      nickname: data.nickname || null,
      age: data.age ? parseInt(data.age) : null,
      birth_date: data.birth_date || null,
      birth_place: data.birth_place || null,
      height: data.height ? parseInt(data.height) : null,
      weight: data.weight ? parseInt(data.weight) : null,
      hair_color: data.hair_color || null,
      measurements: data.measurements || null,
      department: data.department || null,
      city: data.city || null,
      work_zone: data.work_zone || null,
      category: data.category || null,
      service_type: data.service_type || null,
      description: data.description || null,
      public_photos: data.public_photos,
      exclusive_photos: data.exclusive_photos,
      exclusive_videos: data.exclusive_videos,
      photos: data.public_photos, // mantener compat
      whatsapp: data.whatsapp || null,
      telegram: data.telegram || null,
      account_type: "creator",
    };
    const { error } = await supabase.from("profiles").upsert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Cambios guardados");
  };

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SeoNoIndex />
        <Header />
        <main className="container flex-1 py-20 text-center text-muted-foreground">{t("common.loading")}</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SeoNoIndex />
      <Header />
      <main className="container flex-1 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-extrabold">Panel de creador</h1>
              <p className="text-muted-foreground mt-1">Gestiona tu marca personal sin intermediarios.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 ring-1 ring-accent/40 px-3 py-1 text-xs font-bold text-accent uppercase">
                <Crown className="h-3.5 w-3.5" /> {tier}
              </span>
              <KycPill status={data.verification_status} verified={data.is_verified} />
            </div>
          </header>

          <Tabs defaultValue="basic">
            <TabsList className="w-full overflow-x-auto justify-start sm:justify-center">
              <TabsTrigger value="basic">{t("dashboard.tab.basic")}</TabsTrigger>
              <TabsTrigger value="physical">{t("dashboard.tab.physical")}</TabsTrigger>
              <TabsTrigger value="bio">{t("dashboard.tab.bio")}</TabsTrigger>
              <TabsTrigger value="media">{t("dashboard.tab.media")}</TabsTrigger>
              <TabsTrigger value="status">{t("dashboard.tab.status")}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-5 mt-5">
              <Section title="Datos básicos">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Nombre"><Input value={data.display_name} onChange={(e) => update("display_name", e.target.value)} maxLength={40} /></Field>
                  <Field label="Apodo público"><Input value={data.nickname} onChange={(e) => update("nickname", e.target.value)} maxLength={40} placeholder="Cómo aparecerás" /></Field>
                  <Field label="Edad"><Input type="number" min={18} max={99} value={data.age} onChange={(e) => update("age", e.target.value)} /></Field>
                  <Field label="Fecha de nacimiento"><Input type="date" value={data.birth_date} onChange={(e) => update("birth_date", e.target.value)} /></Field>
                  <Field label="Lugar de nacimiento"><Input value={data.birth_place} onChange={(e) => update("birth_place", e.target.value)} /></Field>
                  <Field label="WhatsApp (sin +)"><Input value={data.whatsapp} onChange={(e) => update("whatsapp", e.target.value.replace(/[^\d]/g, ""))} placeholder="573001234567" inputMode="numeric" /></Field>
                </div>
              </Section>
              <Section title="Ubicación">
                <Field label="Departamento">
                  <Select value={data.department} onValueChange={(v) => { update("department", v); update("city", ""); }}>
                    <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Ciudad">
                    <Select value={data.city} onValueChange={(v) => update("city", v)} disabled={!data.department}>
                      <SelectTrigger><SelectValue placeholder={data.department ? "Selecciona" : "Elige departamento"} /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Zona de trabajo"><Input value={data.work_zone} onChange={(e) => update("work_zone", e.target.value)} placeholder="El Poblado, Norte..." /></Field>
                </div>
              </Section>
              <Section title="Categoría">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([k, label]) => (
                    <Pill key={k} active={data.category === k} onClick={() => update("category", k)}>{label}</Pill>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {(Object.entries(SERVICE_LABELS) as [ServiceType, string][]).map(([k, label]) => (
                    <Pill key={k} active={data.service_type === k} onClick={() => update("service_type", k)}>{label}</Pill>
                  ))}
                </div>
              </Section>
            </TabsContent>

            <TabsContent value="physical" className="space-y-5 mt-5">
              <Section title="Atributos físicos">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Altura (cm)"><Input type="number" min={120} max={220} value={data.height} onChange={(e) => update("height", e.target.value)} /></Field>
                  <Field label="Peso (kg)"><Input type="number" min={30} max={200} value={data.weight} onChange={(e) => update("weight", e.target.value)} /></Field>
                  <Field label="Color de cabello"><Input value={data.hair_color} onChange={(e) => update("hair_color", e.target.value)} placeholder="Castaño, rubio, negro..." /></Field>
                  <Field label="Medidas"><Input value={data.measurements} onChange={(e) => update("measurements", e.target.value)} placeholder="90-60-90" /></Field>
                </div>
              </Section>
            </TabsContent>

            <TabsContent value="bio" className="space-y-5 mt-5">
              <Section title="Biografía">
                <Field label={`Descripción (${data.description.length}/500 · mín. 40)`}>
                  <Textarea value={data.description} onChange={(e) => update("description", e.target.value)} rows={6} maxLength={500} placeholder="Cuéntale al mundo cómo eres..." />
                </Field>
                <Field label="Telegram (sin @)">
                  <Input value={data.telegram} onChange={(e) => update("telegram", e.target.value.replace(/[^\w]/g, ""))} placeholder="usuario_tg" />
                </Field>
              </Section>
            </TabsContent>

            <TabsContent value="media" className="space-y-5 mt-5">
              <Section title={`${t("dashboard.public_photos")} (${data.public_photos.length}/${PUBLIC_PHOTO_LIMIT})`}>
                <p className="text-xs text-muted-foreground mb-2">Estas fotos son visibles para todos. Mantenlas elegantes.</p>
                <UploadBox icon={<ImagePlus className="h-7 w-7 text-accent" />} accept="image/*" onChange={onPublicPhotos} disabled={data.public_photos.length >= PUBLIC_PHOTO_LIMIT} hint="JPG / PNG · máximo 3" />
                {data.public_photos.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {data.public_photos.map((src, i) => (
                      <Tile key={i} url={src} onRemove={() => removePublic(i)} />
                    ))}
                  </div>
                )}
              </Section>

              <Section title={`${t("dashboard.exclusive_photos")} (${data.exclusive_photos.length}/${exclusivePhotoLimit})`}>
                <p className="text-xs text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-accent" /> Solo visible para suscriptores premium · plan {tier}
                </p>
                <UploadBox icon={<Lock className="h-7 w-7 text-accent" />} accept="image/*" onChange={onExclusivePhotos} disabled={data.exclusive_photos.length >= exclusivePhotoLimit} hint={`Cupo: ${exclusivePhotoLimit}`} />
                {data.exclusive_photos.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {data.exclusive_photos.map((p, i) => (
                      <PrivateTile key={p} path={p} onRemove={() => removeExclPhoto(i)} />
                    ))}
                  </div>
                )}
              </Section>

              <Section title={`${t("dashboard.exclusive_videos")} (${data.exclusive_videos.length}/${exclusiveVideoLimit})`}>
                <UploadBox icon={<Video className="h-7 w-7 text-accent" />} accept="video/*" onChange={onExclusiveVideos} disabled={data.exclusive_videos.length >= exclusiveVideoLimit} hint={`Cupo: ${exclusiveVideoLimit} videos`} />
                {data.exclusive_videos.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {data.exclusive_videos.map((p, i) => (
                      <PrivateTile key={p} path={p} type="video" onRemove={() => removeExclVideo(i)} />
                    ))}
                  </div>
                )}
              </Section>
            </TabsContent>

            <TabsContent value="status" className="space-y-5 mt-5">
              <Section title="Estado de tu cuenta">
                <KycCard status={data.verification_status} verified={data.is_verified} />
              </Section>
            </TabsContent>
          </Tabs>

          <div className="sticky bottom-4 z-10">
            <Button variant="hero" size="lg" onClick={save} disabled={saving} className="w-full rounded-full gap-2 shadow-elevated">
              <Save className="h-4 w-4" /> {saving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="card-glass rounded-3xl p-5 sm:p-7 space-y-4">
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

const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-xl px-3 py-2.5 text-sm font-medium ring-1 transition-all",
      active ? "bg-gradient-primary text-primary-foreground ring-transparent shadow-glow-soft" : "bg-secondary text-foreground ring-border hover:ring-accent/50",
    )}
  >
    {children}
  </button>
);

const UploadBox = ({
  icon, accept, onChange, disabled, hint,
}: { icon: React.ReactNode; accept: string; onChange: (f: FileList | null) => void; disabled?: boolean; hint?: string }) => (
  <label className={cn(
    "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 transition-colors",
    disabled ? "border-border bg-background/20 opacity-60 cursor-not-allowed" : "border-border bg-background/40 hover:border-accent/60 hover:bg-accent/5 cursor-pointer",
  )}>
    {icon}
    <span className="text-sm">{disabled ? "Cupo alcanzado" : "Toca para subir"}</span>
    {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    <input type="file" accept={accept} multiple className="hidden" disabled={disabled} onChange={(e) => onChange(e.target.files)} />
  </label>
);

const Tile = ({ url, onRemove }: { url: string; onRemove: () => void }) => (
  <div className="relative group">
    <img src={url} alt="" className="aspect-square w-full object-cover rounded-xl ring-1 ring-border" />
    <button type="button" onClick={onRemove} className="absolute top-1 right-1 rounded-full bg-background/80 p-1 opacity-0 group-hover:opacity-100 transition">
      <X className="h-3.5 w-3.5" />
    </button>
  </div>
);

const PrivateTile = ({ path, type = "photo", onRemove }: { path: string; type?: "photo" | "video"; onRemove: () => void }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage.from("exclusive-media").createSignedUrl(path, 600).then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [path]);
  return (
    <div className="relative group aspect-square rounded-xl ring-1 ring-border bg-secondary overflow-hidden">
      {url ? (
        type === "photo"
          ? <img src={url} alt="" className="h-full w-full object-cover" />
          : <video src={url} className="h-full w-full object-cover" muted />
      ) : (
        <div className="h-full w-full animate-pulse" />
      )}
      <span className="absolute top-1 left-1 rounded-full bg-background/70 px-1.5 py-0.5 text-[10px] font-bold text-accent">PREMIUM</span>
      <button type="button" onClick={onRemove} className="absolute top-1 right-1 rounded-full bg-background/80 p-1 opacity-0 group-hover:opacity-100 transition">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

const KycPill = ({ status, verified }: { status: string; verified: boolean }) => {
  if (verified) return <span className="inline-flex items-center gap-1 rounded-full bg-verified/15 ring-1 ring-verified/40 px-3 py-1 text-xs font-bold text-verified"><BadgeCheck className="h-3.5 w-3.5" /> Verificado</span>;
  if (status === "pending") return <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 ring-1 ring-accent/40 px-3 py-1 text-xs font-bold text-accent"><Clock className="h-3.5 w-3.5" /> En revisión</span>;
  return <a href="/verificacion" className="inline-flex items-center gap-1 rounded-full bg-secondary ring-1 ring-border px-3 py-1 text-xs font-bold text-muted-foreground hover:text-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Verificarme</a>;
};

const KycCard = ({ status, verified }: { status: string; verified: boolean }) => {
  const { t } = useI18n();
  if (verified) {
    return (
      <div className="text-center p-6">
        <BadgeCheck className="h-12 w-12 text-verified mx-auto" />
        <p className="mt-3 font-display text-xl font-bold">{t("dashboard.kyc_approved")}</p>
        <p className="text-sm text-muted-foreground mt-1">Tus selfies fueron eliminadas por privacidad.</p>
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="text-center p-6">
        <Clock className="h-12 w-12 text-accent mx-auto" />
        <p className="mt-3 font-display text-xl font-bold">{t("dashboard.kyc_pending")}</p>
      </div>
    );
  }
  return (
    <div className="text-center p-6">
      <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto" />
      <p className="mt-3 font-display text-xl font-bold">{t("dashboard.kyc_unverified")}</p>
      <Button asChild variant="hero" className="mt-4 rounded-full"><a href="/verificacion">Iniciar verificación KYC</a></Button>
    </div>
  );
};

export default Dashboard;
