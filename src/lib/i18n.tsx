import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "es" | "en";

type Dict = Record<string, string>;

const ES: Dict = {
  "nav.explore": "Explorar",
  "nav.plans": "Planes",
  "nav.account": "Mi cuenta",
  "nav.signin": "Iniciar sesión",
  "nav.create": "Crear cuenta",
  "nav.edit": "Editar perfil",

  "gateway.title": "¿Cómo quieres unirte a DeseoX?",
  "gateway.subtitle": "Elige el tipo de cuenta que mejor se ajusta a ti.",
  "gateway.visitor.title": "Quiero explorar y conectar",
  "gateway.visitor.desc": "Registro simple para ver perfiles, comentar y suscribirte a contenido premium.",
  "gateway.visitor.cta": "Crear cuenta de visitante",
  "gateway.creator.title": "Quiero publicar mi contenido",
  "gateway.creator.desc": "Verificación KYC con doble selfie para publicar tu perfil profesional.",
  "gateway.creator.cta": "Crear cuenta de creador",

  "philosophy.tag": "Filosofía DeseoX",
  "philosophy.title": "Dopamina real",
  "philosophy.body":
    "DeseoX: Supera la saturación digital. Rescatamos el valor del encuentro auténtico y el bienestar a través de conexiones seguras y reales.",

  "profile.about": "Sobre mí",
  "profile.services": "Servicios",
  "profile.unlock": "Desbloquea contenido Premium",
  "profile.exclusive": "Contenido exclusivo",
  "profile.signin_to_comment": "Inicia sesión para comentar",
  "profile.translate_to_en": "Traducir al inglés",
  "profile.translate_to_es": "Ver original en español",
  "profile.translating": "Traduciendo…",

  "dashboard.tab.basic": "Datos",
  "dashboard.tab.physical": "Ficha técnica",
  "dashboard.tab.bio": "Biografía",
  "dashboard.tab.media": "Multimedia",
  "dashboard.tab.status": "Estado",
  "dashboard.public_photos": "Fotos públicas (3 máx · contenido limpio)",
  "dashboard.exclusive_photos": "Fotos exclusivas (premium)",
  "dashboard.exclusive_videos": "Videos exclusivos (premium)",
  "dashboard.kyc_pending": "Tu perfil está en revisión",
  "dashboard.kyc_approved": "Verificado ✓",
  "dashboard.kyc_unverified": "Sin verificar — sube tus selfies KYC",

  "common.save": "Guardar cambios",
  "common.saving": "Guardando…",
  "common.loading": "Cargando…",
};

const EN: Dict = {
  "nav.explore": "Explore",
  "nav.plans": "Plans",
  "nav.account": "My account",
  "nav.signin": "Sign in",
  "nav.create": "Sign up",
  "nav.edit": "Edit profile",

  "gateway.title": "How do you want to join DeseoX?",
  "gateway.subtitle": "Pick the account type that suits you best.",
  "gateway.visitor.title": "I want to explore and connect",
  "gateway.visitor.desc": "Quick sign-up to browse profiles, leave reviews and subscribe to premium content.",
  "gateway.visitor.cta": "Create visitor account",
  "gateway.creator.title": "I want to publish my content",
  "gateway.creator.desc": "KYC verification with double selfie to publish your professional profile.",
  "gateway.creator.cta": "Create creator account",

  "philosophy.tag": "DeseoX Philosophy",
  "philosophy.title": "Real dopamine",
  "philosophy.body":
    "DeseoX: Beat digital overload. We rescue the value of authentic encounters and wellbeing through safe, real connections.",

  "profile.about": "About me",
  "profile.services": "Services",
  "profile.unlock": "Unlock Premium content",
  "profile.exclusive": "Exclusive content",
  "profile.signin_to_comment": "Sign in to comment",
  "profile.translate_to_en": "Translate to English",
  "profile.translate_to_es": "View Spanish original",
  "profile.translating": "Translating…",

  "dashboard.tab.basic": "Basics",
  "dashboard.tab.physical": "Physical",
  "dashboard.tab.bio": "Bio",
  "dashboard.tab.media": "Media",
  "dashboard.tab.status": "Status",
  "dashboard.public_photos": "Public photos (max 3 · clean content)",
  "dashboard.exclusive_photos": "Exclusive photos (premium)",
  "dashboard.exclusive_videos": "Exclusive videos (premium)",
  "dashboard.kyc_pending": "Your profile is under review",
  "dashboard.kyc_approved": "Verified ✓",
  "dashboard.kyc_unverified": "Unverified — upload your KYC selfies",

  "common.save": "Save changes",
  "common.saving": "Saving…",
  "common.loading": "Loading…",
};

const DICTS: Record<Lang, Dict> = { es: ES, en: EN };

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<Ctx>({ lang: "es", setLang: () => {}, t: (k) => k });

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("deseox.lang")) as Lang | null;
    return saved === "en" || saved === "es" ? saved : "es";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem("deseox.lang", lang); } catch {}
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const t = (key: string) => DICTS[lang][key] ?? DICTS.es[key] ?? key;

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
