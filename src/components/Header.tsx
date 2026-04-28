import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Sparkles, Compass, Crown, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { LangSwitcher } from "@/components/LangSwitcher";
import { supabase } from "@/integrations/supabase/client";

export const Header = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [accountType, setAccountType] = useState<"visitor" | "creator" | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setAccountType(null);
      return;
    }
    supabase
      .from("profiles")
      .select("account_type")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const t = (data as any)?.account_type;
        setAccountType(t === "creator" ? "creator" : "visitor");
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isCreator = accountType === "creator";
  const showCreatorCta = !user || isCreator;

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/55 backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/40">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo size="md" />

        <nav className="hidden md:flex items-center gap-1 rounded-full bg-secondary/40 p-1 ring-1 ring-border/60">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-all",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <Compass className="h-4 w-4" /> {t("nav.explore")}
          </NavLink>
          <NavLink
            to="/planes"
            className={({ isActive }) =>
              cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-all",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <Crown className="h-4 w-4" /> {t("nav.plans")}
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <LangSwitcher className="hidden sm:inline-flex" />
          {user ? (
            <Button asChild variant="outline" size="sm" className="rounded-full gap-2">
              <Link to="/cuenta">
                <UserCircle2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.account")}</span>
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="rounded-full hidden sm:inline-flex">
              <Link to="/auth">{t("nav.signin")}</Link>
            </Button>
          )}
          {showCreatorCta && (
            <Button asChild variant="hero" size="sm" className="gap-2 rounded-full btn-shine">
              <Link to={user ? "/dashboard" : "/registro"}>
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">{user ? t("nav.edit") : "Unirme a DeseoX"}</span>
                <span className="sm:hidden">{user ? "Editar" : "Unirme"}</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
