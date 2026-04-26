import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Stars } from "./Stars";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  author_id: string;
  stars: number;
  comment: string | null;
  created_at: string;
  author_name?: string;
}

interface Props {
  profileId: string;
  ratingAvg: number;
  ratingCount: number;
  onChanged?: () => void;
}

export const ProfileReviews = ({ profileId, ratingAvg, ratingCount, onChanged }: Props) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myReview, setMyReview] = useState<Review | null>(null);

  const load = async () => {
    setLoading(true);
    
    const { data: rev } = await supabase
      .from("reviews")
      .select("id, author_id, stars, comment, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(50);

    const list = (rev ?? []) as Review[];
    if (list.length > 0) {
      const ids = Array.from(new Set(list.map((r) => r.author_id)));
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ids);
      const byId = new Map((profs ?? []).map((p) => [p.id, p.display_name]));
      list.forEach((r) => (r.author_name = byId.get(r.author_id) ?? "Usuario"));
    }
    setReviews(list);
    setMyReview(user ? list.find((r) => r.author_id === user.id) ?? null : null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [profileId, user?.id]);

  useEffect(() => {
    if (myReview) {
      setStars(myReview.stars);
      setComment(myReview.comment ?? "");
    }
  }, [myReview]);

  const canReview = !!user && user.id !== profileId;
  const isOwn = user?.id === profileId;

  const submit = async () => {
    if (!user) return;
    if (stars < 1) {
      toast.error("Selecciona una calificación de 1 a 5 estrellas");
      return;
    }
    setSubmitting(true);
    
    const { error } = await supabase.from("reviews").upsert(
      { profile_id: profileId, author_id: user.id, stars, comment: comment.trim() || null },
      { onConflict: "profile_id,author_id" },
    );
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(myReview ? "Reseña actualizada" : "¡Gracias por tu reseña!");
    await load();
    onChanged?.();
  };

  const remove = async () => {
    if (!myReview) return;
    setSubmitting(true);
    
    const { error } = await supabase.from("reviews").delete().eq("id", myReview.id);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStars(0);
    setComment("");
    setMyReview(null);
    await load();
    onChanged?.();
  };

  return (
    <section>
      <div className="flex items-end justify-between gap-3 mb-4">
        <h2 className="font-display text-lg font-bold">Reseñas</h2>
        <div className="text-right">
          {ratingCount > 0 ? (
            <>
              <Stars value={ratingAvg} count={ratingCount} size="md" />
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Aún sin reseñas</span>
          )}
        </div>
      </div>

      {/* Form */}
      {canReview && (
        <div className="card-glass rounded-2xl p-4 mb-5">
          <p className="text-sm font-medium mb-3">{myReview ? "Edita tu reseña" : "Escribe una reseña"}</p>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStars(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${n} estrellas`}
                className="p-0.5"
              >
                <Star
                  className={cn(
                    "h-7 w-7 transition-colors",
                    (hover || stars) >= n
                      ? "fill-[hsl(var(--gold))] text-[hsl(var(--gold))]"
                      : "text-muted-foreground/40",
                  )}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Cuenta tu experiencia (opcional)"
            maxLength={500}
            rows={3}
            className="bg-background/60"
          />
          <div className="mt-3 flex items-center gap-2 justify-end">
            {myReview && (
              <Button variant="ghost" size="sm" onClick={remove} disabled={submitting}>
                <Trash2 className="h-4 w-4" /> Eliminar
              </Button>
            )}
            <Button onClick={submit} disabled={submitting} variant="hero" size="sm" className="rounded-full">
              {myReview ? "Actualizar reseña" : "Publicar reseña"}
            </Button>
          </div>
        </div>
      )}

      {!user && (
        <div className="card-glass rounded-2xl p-4 mb-5 text-center text-sm text-muted-foreground">
          <a href="/auth" className="text-accent font-semibold hover:underline">Inicia sesión</a> para dejar una reseña.
        </div>
      )}

      {isOwn && (
        <div className="card-glass rounded-2xl p-4 mb-5 text-center text-sm text-muted-foreground">
          Este es tu perfil. Las reseñas las dejan otros usuarios.
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando reseñas…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sé el primero en dejar una reseña.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="card-glass rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-sm">{r.author_name ?? "Usuario"}</span>
                <Stars value={r.stars} size="sm" showCount={false} />
              </div>
              {r.comment && <p className="text-sm text-foreground/85 leading-relaxed">{r.comment}</p>}
              <p className="mt-1 text-[11px] text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
