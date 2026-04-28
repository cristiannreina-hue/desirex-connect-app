import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Eye, Camera, ArrowRight, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAccountType } from "@/hooks/useAccountType";

const Registro = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { accountType, loading: accountTypeLoading } = useAccountType(user?.id);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [savingChoice, setSavingChoice] = useState(false);

  useEffect(() => {
    document.title = "Únete a DeseoX";
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCheckingProfile(false);
      return;
    }

    if (accountTypeLoading) {
      setCheckingProfile(true);
      return;
    }

    if (accountType === "creator") {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (accountType === "visitor") {
      toast.info("Tu cuenta es de visitante");
      navigate("/", { replace: true });
      return;
    }

    setCheckingProfile(false);
  }, [accountType, accountTypeLoading, authLoading, navigate, user]);

  const choose = async (type: "visitor" | "creator") => {
    try {
      sessionStorage.setItem("deseox.intent", type);
    } catch {}

    if (!user) {
      navigate(`/auth?intent=${type}`);
      return;
    }

    setSavingChoice(true);
    const { error } = await supabase.from("profiles").upsert(
      { id: user.id, account_type: type },
      { onConflict: "id" },
    );
    setSavingChoice(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    navigate(type === "creator" ? "/dashboard" : "/cuenta");
  };

  if (authLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container flex-1 py-12 max-w-5xl mx-auto w-full text-center text-muted-foreground">
          Cargando tu perfil…
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container flex-1 py-12 max-w-5xl mx-auto w-full">
        <header className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 ring-1 ring-accent/40 px-3 py-1 text-xs text-accent font-semibold mb-4">
            <ShieldCheck className="h-3.5 w-3.5" /> DeseoX
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
            {t("gateway.title")}
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{t("gateway.subtitle")}</p>
        </header>

        <div className="grid md:grid-cols-2 gap-5">
          <button
            onClick={() => choose("visitor")}
            disabled={savingChoice}
            className="group card-premium rounded-3xl p-7 text-left transition-all hover:scale-[1.01] hover:shadow-glow-soft"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-foreground ring-1 ring-border mb-4">
              <Eye className="h-6 w-6" />
            </div>
            <h2 className="font-display text-2xl font-extrabold">{t("gateway.visitor.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {t("gateway.visitor.desc")}
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
              {t("gateway.visitor.cta")} <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>

          <button
            onClick={() => choose("creator")}
            disabled={savingChoice}
            className="group card-premium rounded-3xl p-7 text-left transition-all hover:scale-[1.01] hover:shadow-glow-soft ring-2 ring-accent/40"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow-soft mb-4">
              <Camera className="h-6 w-6" />
            </div>
            <h2 className="font-display text-2xl font-extrabold">
              {t("gateway.creator.title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {t("gateway.creator.desc")}
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
              {t("gateway.creator.cta")} <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link to="/auth" className="text-accent hover:underline">
            Inicia sesión
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default Registro;
