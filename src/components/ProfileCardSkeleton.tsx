import { cn } from "@/lib/utils";

interface Props {
  count?: number;
  className?: string;
}

/** Skeleton "fantasma" para grid de ProfileCard mientras cargan datos/fotos */
export const ProfileCardSkeleton = ({ count = 8, className }: Props) => (
  <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="relative overflow-hidden rounded-3xl ring-1 ring-border/60 bg-card shadow-card aspect-[4/5]"
      >
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-secondary to-muted" />
        <div className="absolute inset-0 overlay-bottom" />
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <div className="h-4 w-2/3 rounded-full bg-foreground/15 animate-pulse" />
          <div className="h-3 w-1/3 rounded-full bg-foreground/10 animate-pulse" />
        </div>
        {/* Sheen barrido */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, transparent 30%, hsl(var(--accent) / 0.08) 50%, transparent 70%)",
            backgroundSize: "250% 100%",
            animation: "verified-sheen 1.8s linear infinite",
          }}
        />
      </div>
    ))}
  </div>
);
