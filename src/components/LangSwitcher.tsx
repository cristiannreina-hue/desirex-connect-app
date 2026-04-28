import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const FLAGS: Record<"es" | "en", string> = { es: "🇪🇸", en: "🇬🇧" };
const LABELS: Record<"es" | "en", string> = { es: "ES", en: "EN" };

export const LangSwitcher = ({ className }: { className?: string }) => {
  const { lang, setLang } = useI18n();
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-secondary/40 p-0.5 ring-1 ring-border/60 text-[11px] font-bold shadow-card",
        className,
      )}
      role="group"
      aria-label="Selector de idioma"
    >
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          aria-label={l === "es" ? "Español" : "English"}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all uppercase tracking-wider",
            lang === l
              ? "bg-gradient-primary text-primary-foreground shadow-glow-soft"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span aria-hidden className="text-sm leading-none">{FLAGS[l]}</span>
          <span>{LABELS[l]}</span>
        </button>
      ))}
    </div>
  );
};
