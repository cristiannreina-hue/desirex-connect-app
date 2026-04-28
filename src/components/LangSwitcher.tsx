import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const LangSwitcher = ({ className }: { className?: string }) => {
  const { lang, setLang } = useI18n();
  return (
    <div className={cn("inline-flex rounded-full bg-secondary/40 p-0.5 ring-1 ring-border/60 text-[11px] font-bold", className)}>
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "px-2.5 py-1 rounded-full transition-colors uppercase tracking-wider",
            lang === l ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
};
