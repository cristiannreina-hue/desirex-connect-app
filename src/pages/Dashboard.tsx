import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { COLOMBIA, DEPARTMENTS } from "@/data/colombia";
import { CATEGORY_LABELS, SERVICE_LABELS, type Category, type ServiceType } from "@/types/profile";
import { ImagePlus, Save, X, ShieldCheck, Crown, Lock, Video, BadgeCheck, Clock, Camera, FileText, Ruler, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SeoNoIndex } from "@/components/SeoNoIndex";
import { useI18n } from "@/lib/i18n";
import { watermarkFile } from "@/lib/watermark";
import { WatermarkOverlay } from "@/components/WatermarkOverlay";

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
  exclusive_photos: string[];
  exclusive_videos: string[];
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
          account_type: (anyP.account_type ?? "visitor") as any,
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

  const isVisitor = data.account_type === "visitor";
  const publicPhotoLimit = isVisitor ? 1 : PUBLIC_PHOTO_LIMIT;
  const exclusivePhotoLimit = EXCLUSIVE_PHOTO_LIMIT_BY_TIER[tier] ?? 6;
  const exclusiveVideoLimit = EXCLUSIVE_VIDEO_LIMIT_BY_TIER[tier] ?? 2;

  const onPublicPhotos = async (files: FileList | null) => {
    if (!files || !user) return;
    const remaining = publicPhotoLimit - data.public_photos.length;
    const picked = Array.from(files).slice(0, remaining);
    const uploaded: string[] = [];
    for (const original of picked) {
      const file = await watermarkFile(original);
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/public-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: false });
      if (error) { toast.error(error.message); continue; }
      const { data: pub } = supabase.storage.from("profile-photos").getPublicUrl(path);
      uploaded.push(pub.publicUrl);
    }
    if (uploaded.length) {
      update("public_photos", [...data.public_photos, ...uploaded]);
      toast.success(`${uploaded.length} foto(s) con marca de agua DeseoX subidas`);
    }
  };

  const onExclusivePhotos = async (files: FileList | null) => {
    if (!files || !user) return;
    const remaining = exclusivePhotoLimit - data.exclusive_photos.length;
    const picked = Array.from(files).slice(0, remaining);
    const uploaded: string[] = [];
    for (const original of picked) {
      const file = await watermarkFile(original);
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("exclusive-media").upload(path, file, { upsert: false });
      if (error) { toast.error(error.message); continue; }
      uploaded.push(path);
    }
    if (uploaded.length) {
      update("exclusive_photos", [...data.exclusive_photos, ...uploaded]);
      toast.success(`${uploaded.length} foto(s) exclusivas con marca DeseoX subidas`);
    }
  };

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
      toast.success(`${uploaded.length} video(s) subido(s) — la marca de agua se aplica al reproducirlos`);
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
    setSaving(true);

    let payload: any;
    if (isVisitor) {
      // Visitantes: solo nombre + 1 foto de perfil
      const photo = data.public_photos.slice(0, 1);
      payload = {
        id: user.id,
        display_name: data.display_name || null,
        public_photos: photo,
        photos: photo,
      };
    } else {
      payload = {
        id: user.id,
        display_name: data.display_name || null,
        nickname: data.nickname || null,
        hair_color: data.hair_color || null,
        department: data.department || null,
        city: data.city || null,
        work_zone: data.work_zone || null,
        category: data.category || null,
        service_type: data.service_type || null,
        description: data.description || null,
        public_photos: data.public_photos,
        exclusive_photos: data.exclusive_photos,
        exclusive_videos: data.exclusive_videos,
        photos: data.public_photos,
        whatsapp: data.whatsapp || null,
        telegram: data.telegram || null,
      };
    }
    // NOTA: nunca enviamos account_type. La promoción visitor → creator
    // está bloqueada por el trigger protect_account_type a nivel servidor.
    const { error } = await supabase.from("profiles").upsert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Cambios guardados");
  };

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0A0A0A]">
        <SeoNoIndex />
        <Header />
        <main className="container flex-1 py-20 text-center text-muted-foreground">{t("common.loading")}</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A]">
      <SeoNoIndex />
      <Header />

      {/* Glow ambient */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[160px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/[0.07] blur-[160px]" />
      </div>

      <main className="relative z-10 flex-1 px-4 sm:px-6 py-6 pb-32">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Header móvil */}
          <header className="flex items-center justify-between gap-3 px-1">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {isVisitor ? "Mi información" : "Editar perfil"}
              </h1>
              <p className="text-xs text-white/50 mt-0.5">
                {isVisitor ? "Cuenta de visitante · datos básicos" : "Tu marca personal · sin intermediarios"}
              </p>
            </div>
            {!isVisitor && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 ring-1 ring-accent/40 px-3 py-1 text-[10px] font-bold text-accent uppercase tracking-wider backdrop-blur-md">
                <Crown className="h-3 w-3" /> {tier}
              </span>
            )}
          </header>

          {isVisitor ? (
            <>
              {/* Visitante: solo nombre + 1 foto de perfil */}
              <Block icon={<Camera className="h-4 w-4" />} title="Foto de perfil" subtitle="Una imagen para tu cuenta">
                <SubLabel>Foto · {data.public_photos.length}/{publicPhotoLimit}</SubLabel>
                <UploadBox
                  icon={<ImagePlus className="h-6 w-6 text-accent" />}
                  accept="image/*"
                  onChange={onPublicPhotos}
                  disabled={data.public_photos.length >= publicPhotoLimit}
                  hint="JPG / PNG · 1 sola foto"
                />
                {data.public_photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {data.public_photos.map((src, i) => <Tile key={i} url={src} onRemove={() => removePublic(i)} />)}
                  </div>
                )}
              </Block>

              <Block icon={<FileText className="h-4 w-4" />} title="Identidad" subtitle="Cómo apareces en DeseoX">
                <GlassField label="Nombre o alias">
                  <GlassInput value={data.display_name} onChange={(e) => update("display_name", e.target.value)} maxLength={40} />
                </GlassField>
              </Block>
            </>
          ) : (
            <>
              {/* Banner KYC persistente */}
              <VerifiedBanner status={data.verification_status} verified={data.is_verified} />

              {/* 1 · IDENTIDAD VISUAL */}
              <Block icon={<Camera className="h-4 w-4" />} title="Identidad Visual" subtitle="Galería pública y contenido exclusivo">
                <SubLabel>Fotos públicas · {data.public_photos.length}/{publicPhotoLimit}</SubLabel>
                <UploadBox icon={<ImagePlus className="h-6 w-6 text-accent" />} accept="image/*" onChange={onPublicPhotos} disabled={data.public_photos.length >= publicPhotoLimit} hint="JPG / PNG · máximo 3" />
                {data.public_photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {data.public_photos.map((src, i) => <Tile key={i} url={src} onRemove={() => removePublic(i)} />)}
                  </div>
                )}

                <div className="h-px bg-white/5 my-2" />

                <SubLabel>
                  <Lock className="h-3 w-3 inline mr-1 text-accent" />
                  Fotos exclusivas · {data.exclusive_photos.length}/{exclusivePhotoLimit}
                </SubLabel>
                <UploadBox icon={<Lock className="h-6 w-6 text-accent" />} accept="image/*" onChange={onExclusivePhotos} disabled={data.exclusive_photos.length >= exclusivePhotoLimit} hint={`Plan ${tier} · cupo ${exclusivePhotoLimit}`} />
                {data.exclusive_photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {data.exclusive_photos.map((p, i) => <PrivateTile key={p} path={p} onRemove={() => removeExclPhoto(i)} />)}
                  </div>
                )}

                <div className="h-px bg-white/5 my-2" />

                <SubLabel>
                  <Video className="h-3 w-3 inline mr-1 text-accent" />
                  Videos exclusivos · {data.exclusive_videos.length}/{exclusiveVideoLimit}
                </SubLabel>
                <UploadBox icon={<Video className="h-6 w-6 text-accent" />} accept="video/*" onChange={onExclusiveVideos} disabled={data.exclusive_videos.length >= exclusiveVideoLimit} hint={`Cupo ${exclusiveVideoLimit} videos`} />
                {data.exclusive_videos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {data.exclusive_videos.map((p, i) => <PrivateTile key={p} path={p} type="video" onRemove={() => removeExclVideo(i)} />)}
                  </div>
                )}
              </Block>

              {/* 2 · NARRATIVA PROFESIONAL */}
              <Block icon={<FileText className="h-4 w-4" />} title="Narrativa Profesional" subtitle="Tu historia, tu voz">
                <GlassField label={`Biografía · ${data.description.length}/500 (mín. 40)`}>
                  <Textarea
                    value={data.description}
                    onChange={(e) => update("description", e.target.value)}
                    rows={6}
                    maxLength={500}
                    placeholder="Cuéntale al mundo cómo eres, qué te apasiona, qué te hace única..."
                    className="bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 rounded-2xl backdrop-blur-md focus-visible:ring-accent/60 focus-visible:border-accent/40 resize-none"
                  />
                </GlassField>
                <div className="grid sm:grid-cols-2 gap-3">
                  <GlassField label="WhatsApp (sin +)">
                    <GlassInput value={data.whatsapp} onChange={(e) => update("whatsapp", e.target.value.replace(/[^\d]/g, ""))} placeholder="573001234567" inputMode="numeric" />
                  </GlassField>
                  <GlassField label="Telegram (sin @)">
                    <GlassInput value={data.telegram} onChange={(e) => update("telegram", e.target.value.replace(/[^\w]/g, ""))} placeholder="usuario_tg" />
                  </GlassField>
                </div>
              </Block>

              {/* 3 · ESPECIFICACIONES */}
              <Block icon={<Ruler className="h-4 w-4" />} title="Especificaciones de Perfil" subtitle="Datos técnicos y atributos">
                <div className="grid sm:grid-cols-2 gap-3">
                  <GlassField label="Nombre">
                    <GlassInput value={data.display_name} onChange={(e) => update("display_name", e.target.value)} maxLength={40} />
                  </GlassField>
                  <GlassField label="Apodo público">
                    <GlassInput value={data.nickname} onChange={(e) => update("nickname", e.target.value)} maxLength={40} placeholder="Cómo aparecerás" />
                  </GlassField>
                  <GlassField label="Color de cabello">
                    <GlassInput value={data.hair_color} onChange={(e) => update("hair_color", e.target.value)} placeholder="Castaño, rubio, negro..." />
                  </GlassField>
                </div>

                <div className="h-px bg-white/5 my-2" />

                <SubLabel>Ubicación</SubLabel>
                <GlassField label="Departamento">
                  <Select value={data.department} onValueChange={(v) => { update("department", v); update("city", ""); }}>
                    <SelectTrigger className="bg-white/[0.03] border-white/10 text-white rounded-2xl backdrop-blur-md focus:ring-accent/60"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent className="max-h-72 bg-[#0A0A0A] border-white/10">
                      {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </GlassField>
                <div className="grid sm:grid-cols-2 gap-3">
                  <GlassField label="Ciudad">
                    <Select value={data.city} onValueChange={(v) => update("city", v)} disabled={!data.department}>
                      <SelectTrigger className="bg-white/[0.03] border-white/10 text-white rounded-2xl backdrop-blur-md focus:ring-accent/60"><SelectValue placeholder={data.department ? "Selecciona" : "Elige depto"} /></SelectTrigger>
                      <SelectContent className="max-h-72 bg-[#0A0A0A] border-white/10">
                        {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </GlassField>
                  <GlassField label="Zona de trabajo">
                    <GlassInput value={data.work_zone} onChange={(e) => update("work_zone", e.target.value)} placeholder="El Poblado, Norte..." />
                  </GlassField>
                </div>

                <div className="h-px bg-white/5 my-2" />

                <SubLabel>Categoría</SubLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([k, label]) => (
                    <Pill key={k} active={data.category === k} onClick={() => update("category", k)}>{label}</Pill>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(Object.entries(SERVICE_LABELS) as [ServiceType, string][]).map(([k, label]) => (
                    <Pill key={k} active={data.service_type === k} onClick={() => update("service_type", k)}>{label}</Pill>
                  ))}
                </div>
              </Block>
            </>
          )}
        </div>
      </main>

      {/* Botón flotante guardar */}
      <div className="fixed bottom-4 left-0 right-0 z-30 px-4 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <button
            onClick={save}
            disabled={saving}
            className={cn(
              "w-full h-14 rounded-full font-bold text-base text-white",
              "bg-gradient-to-r from-[#FF7A00] to-[#FF9A40]",
              "shadow-[0_10px_40px_-10px_rgba(255,122,0,0.7),0_0_20px_rgba(255,122,0,0.35)]",
              "hover:brightness-110 active:scale-[0.98] transition-all",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2 backdrop-blur-md",
            )}
          >
            <Save className="h-5 w-5" />
            {saving ? t("common.saving") : isVisitor ? "Actualizar mi información" : "Guardar cambios"}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

/* ============ Subcomponentes ============ */

const Block = ({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) => (
  <section
    className={cn(
      "rounded-[28px] bg-black/80 backdrop-blur-xl",
      "border border-white/5",
      "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,122,0,0.04),inset_0_1px_0_rgba(255,255,255,0.04)]",
      "p-5 sm:p-6 space-y-4",
    )}
  >
    <header className="flex items-center gap-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/30 text-accent shadow-[0_0_15px_rgba(255,122,0,0.25)]">
        {icon}
      </span>
      <div>
        <h2 className="font-display text-base font-bold text-white leading-tight">{title}</h2>
        {subtitle && <p className="text-[11px] text-white/40 leading-tight mt-0.5">{subtitle}</p>}
      </div>
    </header>
    <div className="space-y-3">{children}</div>
  </section>
);

const SubLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] uppercase tracking-wider font-bold text-white/40 px-1">{children}</p>
);

const GlassField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-white/60 font-medium px-1">{label}</Label>
    {children}
  </div>
);

const GlassInput = (props: React.ComponentProps<typeof Input>) => (
  <Input
    {...props}
    className={cn(
      "h-11 bg-white/[0.03] border-white/10 text-white placeholder:text-white/30",
      "rounded-2xl backdrop-blur-md",
      "focus-visible:ring-accent/60 focus-visible:ring-offset-0 focus-visible:border-accent/40",
      props.className,
    )}
  />
);

const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-2xl px-3 py-2.5 text-xs font-semibold transition-all backdrop-blur-md",
      active
        ? "bg-gradient-to-r from-[#FF7A00] to-[#FF9A40] text-black shadow-[0_0_20px_rgba(255,122,0,0.45)] ring-0"
        : "bg-white/[0.03] text-white/80 ring-1 ring-white/10 hover:ring-accent/40 hover:bg-white/[0.06]",
    )}
  >
    {children}
  </button>
);

const UploadBox = ({
  icon, accept, onChange, disabled, hint,
}: { icon: React.ReactNode; accept: string; onChange: (f: FileList | null) => void; disabled?: boolean; hint?: string }) => (
  <label className={cn(
    "flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed p-6 transition-all backdrop-blur-md",
    disabled
      ? "border-white/10 bg-white/[0.02] opacity-50 cursor-not-allowed"
      : "border-white/15 bg-white/[0.03] hover:border-accent/60 hover:bg-accent/[0.06] hover:shadow-[0_0_25px_rgba(255,122,0,0.2)] cursor-pointer",
  )}>
    {icon}
    <span className="text-sm text-white/80 font-medium">{disabled ? "Cupo alcanzado" : "Toca para subir"}</span>
    {hint && <span className="text-[11px] text-white/40">{hint}</span>}
    <input type="file" accept={accept} multiple className="hidden" disabled={disabled} onChange={(e) => onChange(e.target.files)} />
  </label>
);

const Tile = ({ url, onRemove }: { url: string; onRemove: () => void }) => (
  <div className="relative group">
    <WatermarkOverlay size="sm" className="aspect-square w-full rounded-2xl ring-1 ring-white/10">
      <img src={url} alt="" className="aspect-square w-full object-cover rounded-2xl" />
    </WatermarkOverlay>
    <button type="button" onClick={onRemove} className="absolute top-1.5 right-1.5 z-20 rounded-full bg-black/80 backdrop-blur-md p-1.5 ring-1 ring-white/10 opacity-0 group-hover:opacity-100 transition">
      <X className="h-3 w-3 text-white" />
    </button>
  </div>
);

const PrivateTile = ({ path, type = "photo", onRemove }: { path: string; type?: "photo" | "video"; onRemove: () => void }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage.from("exclusive-media").createSignedUrl(path, 600).then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [path]);
  return (
    <div className="relative group aspect-square rounded-2xl ring-1 ring-white/10 bg-white/[0.03] overflow-hidden">
      {url ? (
        <WatermarkOverlay size="sm" className="h-full w-full">
          {type === "photo"
            ? <img src={url} alt="" className="h-full w-full object-cover" />
            : <video src={url} className="h-full w-full object-cover" muted onContextMenu={(e) => e.preventDefault()} />}
        </WatermarkOverlay>
      ) : (
        <div className="h-full w-full animate-pulse" />
      )}
      <span className="absolute top-1.5 left-1.5 rounded-full bg-black/80 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-accent ring-1 ring-accent/30">PREMIUM</span>
      <button type="button" onClick={onRemove} className="absolute top-1.5 right-1.5 rounded-full bg-black/80 backdrop-blur-md p-1.5 ring-1 ring-white/10 opacity-0 group-hover:opacity-100 transition">
        <X className="h-3 w-3 text-white" />
      </button>
    </div>
  );
};

const VerifiedBanner = ({ status, verified }: { status: string; verified: boolean }) => {
  if (verified) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[24px] p-4",
          "bg-gradient-to-r from-[#1a0f00] via-[#0A0A0A] to-[#1a0f00]",
          "border border-accent/30",
          "shadow-[0_0_30px_rgba(255,122,0,0.25),inset_0_1px_0_rgba(255,200,100,0.15)]",
        )}
      >
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-accent/40 blur-md animate-pulse" />
            <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-[#FFB347] to-[#FF7A00] flex items-center justify-center shadow-[0_0_20px_rgba(255,122,0,0.6)]">
              <BadgeCheck className="h-5 w-5 text-black" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-sm font-bold text-white flex items-center gap-1.5">
              Perfil Verificado por el CEO
              <Sparkles className="h-3.5 w-3.5 text-accent" />
            </p>
            <p className="text-[11px] text-white/60 leading-tight">KYC aprobado · Sello dorado de confianza</p>
          </div>
        </div>
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="rounded-[24px] p-4 bg-black/80 backdrop-blur-xl border border-accent/20 shadow-[0_0_20px_rgba(255,122,0,0.15)]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent/15 ring-1 ring-accent/40 flex items-center justify-center flex-shrink-0">
            <Clock className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="font-display text-sm font-bold text-white">Verificación en revisión</p>
            <p className="text-[11px] text-white/50">El CEO está revisando tu KYC</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <a
      href="/verificacion"
      className="block rounded-[24px] p-4 bg-black/80 backdrop-blur-xl border border-white/10 hover:border-accent/40 hover:shadow-[0_0_25px_rgba(255,122,0,0.2)] transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-white/[0.05] ring-1 ring-white/15 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="h-5 w-5 text-white/70" />
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-bold text-white">Verifica tu identidad</p>
          <p className="text-[11px] text-white/50">Obtén el sello dorado · más confianza, más visibilidad</p>
        </div>
        <span className="text-accent text-xs font-bold">→</span>
      </div>
    </a>
  );
};

export default Dashboard;
