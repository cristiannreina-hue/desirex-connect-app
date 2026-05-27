import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Crown, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { WatermarkOverlay } from "@/components/WatermarkOverlay";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  profileId: string;
  exclusivePhotos: string[];
  exclusiveVideos: string[];
  /** Si el visitante tiene suscripción activa (o es el dueño) */
  hasAccess: boolean;
  onPhotoClick?: (url: string) => void;
}

interface Resolved { path: string; url: string | null }

export const ExclusiveMedia = ({ profileId, exclusivePhotos, exclusiveVideos, hasAccess, onPhotoClick }: Props) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const [photos, setPhotos] = useState<Resolved[]>([]);
  const [videos, setVideos] = useState<Resolved[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const all = [...exclusivePhotos, ...exclusiveVideos];
    if (all.length === 0) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.functions
        .invoke("exclusive-media-url", { body: { profileId, paths: all } });
      if (cancelled) return;
      if (error || !data) { setLoading(false); return; }
      const map = new Map<string, string | null>(
        (data.urls ?? []).map((u: any) => [u.path, u.url ?? null]),
      );
      setPhotos(exclusivePhotos.map((p) => ({ path: p, url: map.get(p) ?? null })));
      setVideos(exclusiveVideos.map((p) => ({ path: p, url: map.get(p) ?? null })));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [profileId, exclusivePhotos.join(","), exclusiveVideos.join(",")]);

  const total = exclusivePhotos.length + exclusiveVideos.length;
  if (total === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-bold inline-flex items-center gap-2">
          <Crown className="h-5 w-5 text-accent" />
          {t("profile.exclusive")}
        </h2>
        <span className="text-xs text-muted-foreground">{total} elementos</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {exclusivePhotos.map((p, i) => {
          const url = photos.find((x) => x.path === p)?.url ?? null;
          return (
            <Tile key={`p-${p}`} type="photo" url={hasAccess ? url : null} locked={!hasAccess} loading={loading && hasAccess} />
          );
        })}
        {exclusiveVideos.map((p) => {
          const url = videos.find((x) => x.path === p)?.url ?? null;
          return (
            <Tile key={`v-${p}`} type="video" url={hasAccess ? url : null} locked={!hasAccess} loading={loading && hasAccess} />
          );
        })}
      </div>

      {!hasAccess && (
        <div className="mt-4 card-premium rounded-2xl p-6 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/40">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="mt-3 font-display text-lg font-extrabold">
            {user ? "Contenido exclusivo" : "Crea una cuenta de visitante para desbloquear este contenido exclusivo"}
          </p>
          {!user && (
            <p className="mt-1 text-sm text-muted-foreground">
              Es gratis y solo te toma un minuto. Apoya y conecta con tus creadoras favoritas.
            </p>
          )}
          <Button asChild variant="hero" className="mt-5 rounded-full">
            {user ? (
              <Link to="/cuenta">Ir a mi cuenta</Link>
            ) : (
              <Link to={`/registro?redirect=${encodeURIComponent(location.pathname)}`}>
                Regístrate para ver más
              </Link>
            )}
          </Button>
        </div>
      )}
    </section>
  );
};

const Tile = ({
  type, url, locked, loading,
}: { type: "photo" | "video"; url: string | null; locked: boolean; loading: boolean }) => {
  return (
    <div className="relative aspect-square rounded-xl overflow-hidden ring-1 ring-border bg-secondary">
      {url ? (
        <WatermarkOverlay size="sm" className="h-full w-full">
          {type === "photo" ? (
            <img src={url} alt="exclusive" className="h-full w-full object-cover" />
          ) : (
            <video
              src={url}
              className="h-full w-full object-cover"
              controls
              controlsList="nodownload"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              preload="metadata"
            />
          )}
        </WatermarkOverlay>
      ) : (
        <div className={`h-full w-full ${locked ? "blur-2xl" : ""} bg-gradient-to-br from-secondary to-background flex items-center justify-center`}>
          {type === "video" && <Play className="h-7 w-7 text-foreground/40" />}
        </div>
      )}
      {locked && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <Lock className="h-6 w-6 text-foreground/80" />
        </div>
      )}
      {loading && !url && !locked && (
        <div className="absolute inset-0 animate-pulse bg-secondary" />
      )}
    </div>
  );
};
