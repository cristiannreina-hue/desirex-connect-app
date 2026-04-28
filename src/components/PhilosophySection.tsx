import { Link2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const PhilosophySection = () => {
  const { t } = useI18n();
  return (
    <section className="container py-16">
      <div
        className="relative max-w-4xl mx-auto rounded-[2rem] p-10 md:p-16 text-center overflow-hidden border border-white/[0.07]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, hsl(var(--accent) / 0.12), transparent 60%), linear-gradient(180deg, hsl(240 10% 12%), hsl(250 14% 8%))",
          boxShadow:
            "0 30px 80px -30px hsl(0 0% 0% / 0.7), inset 0 1px 0 hsl(0 0% 100% / 0.05), 0 0 60px -20px hsl(var(--accent) / 0.18)",
        }}
      >
        {/* Halo decorativo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.5), transparent 70%)" }}
        />

        {/* Icono central de conexión */}
        <div className="relative inline-flex">
          <span
            className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow ring-1 ring-white/10"
            style={{ boxShadow: "0 0 40px hsl(var(--accent) / 0.45), inset 0 1px 0 hsl(0 0% 100% / 0.25)" }}
          >
            <Link2 className="h-7 w-7" strokeWidth={2.4} />
          </span>
          <span
            aria-hidden
            className="absolute inset-0 rounded-2xl animate-pulse"
            style={{ boxShadow: "0 0 0 6px hsl(var(--accent) / 0.08)" }}
          />
        </div>

        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent/10 ring-1 ring-accent/40 px-3 py-1 text-xs text-accent font-semibold uppercase tracking-widest">
          {t("philosophy.tag")}
        </span>
        <h2 className="mt-4 font-display text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
          <span className="text-gradient hero-text-glow">{t("philosophy.title")}</span>
        </h2>
        <p className="mt-5 text-foreground/70 leading-relaxed text-base md:text-lg max-w-2xl mx-auto">
          {t("philosophy.body")}
        </p>
      </div>
    </section>
  );
};
