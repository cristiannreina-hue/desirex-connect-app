import type { Tier, SubStatus } from "@/types/profile";

export const TIER_BADGE: Record<Tier, { label: string; emoji: string; className: string }> = {
  vip: {
    label: "VIP",
    emoji: "💎",
    className: "bg-gradient-primary text-primary-foreground shadow-glow-soft",
  },
  elite: {
    label: "ELITE",
    emoji: "⭐",
    className: "bg-gradient-accent text-accent-foreground",
  },
  boost: {
    label: "BOOST",
    emoji: "🔥",
    className: "bg-secondary text-foreground ring-1 ring-accent/40",
  },
  starter: {
    label: "STARTER",
    emoji: "✨",
    className: "bg-secondary/70 text-muted-foreground ring-1 ring-border",
  },
};

/** Días enteros que faltan para que expire la suscripción */
export const daysRemaining = (expiresAt?: string): number => {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
};

/** Estado visual: verde / amarillo / rojo */
export const subStateColor = (
  status?: SubStatus,
  expiresAt?: string,
): "green" | "yellow" | "red" => {
  const days = daysRemaining(expiresAt);
  if (!status || status === "expired" || status === "cancelled" || days === 0) return "red";
  if (days <= 7) return "yellow";
  return "green";
};

/** ¿El perfil tiene suscripción vigente y por tanto debería ser visible? */
export const isVisible = (
  status?: SubStatus,
  expiresAt?: string,
): boolean => {
  if (!status) return false;
  if (status !== "trial" && status !== "active") return false;
  return daysRemaining(expiresAt) > 0;
};
