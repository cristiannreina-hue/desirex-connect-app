import { Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const PhilosophySection = () => {
  const { t } = useI18n();
  return (
    <section className="container py-14">
      <div className="card-premium rounded-3xl p-8 md:p-12 text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 ring-1 ring-accent/40 px-3 py-1 text-xs text-accent font-semibold">
          <Sparkles className="h-3.5 w-3.5" /> {t("philosophy.tag")}
        </span>
        <h2 className="mt-4 font-display text-3xl md:text-4xl font-extrabold tracking-tight">
          <span className="text-gradient">{t("philosophy.title")}</span>
        </h2>
        <p className="mt-4 text-muted-foreground leading-relaxed text-base md:text-lg">
          {t("philosophy.body")}
        </p>
      </div>
    </section>
  );
};
