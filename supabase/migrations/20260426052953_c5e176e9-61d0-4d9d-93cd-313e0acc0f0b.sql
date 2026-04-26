-- =========================================
-- 1. ELIMINAR SISTEMA DE MENSAJERÍA
-- =========================================
DROP FUNCTION IF EXISTS public.count_messages_sent(uuid, uuid);
DROP TABLE IF EXISTS public.messages CASCADE;

-- =========================================
-- 2. ENUMS
-- =========================================
DO $$ BEGIN
  CREATE TYPE public.gender_category AS ENUM ('mujeres', 'hombres', 'trans');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_tier AS ENUM ('starter', 'boost', 'elite', 'vip');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================
-- 3. PROFILES: nuevos campos
-- =========================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender public.gender_category NOT NULL DEFAULT 'mujeres',
  ADD COLUMN IF NOT EXISTS rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz NOT NULL DEFAULT now();

-- Migra category libre -> gender enum (best effort)
UPDATE public.profiles
SET gender = CASE
  WHEN lower(coalesce(category,'')) ~ 'hombre|masc|chico|boy|man' THEN 'hombres'::public.gender_category
  WHEN lower(coalesce(category,'')) ~ 'trans|travesti|tv' THEN 'trans'::public.gender_category
  ELSE 'mujeres'::public.gender_category
END;

-- =========================================
-- 4. SUBSCRIPTIONS
-- =========================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tier public.subscription_tier NOT NULL DEFAULT 'starter',
  status public.subscription_status NOT NULL DEFAULT 'trial',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON public.subscriptions(user_id, expires_at)
  WHERE status IN ('trial','active');

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscriptions"
  ON public.subscriptions FOR SELECT USING (true);

CREATE POLICY "Users can insert their own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Función helper: suscripción activa
CREATE OR REPLACE FUNCTION public.get_active_subscription(_user_id uuid)
RETURNS TABLE(tier public.subscription_tier, status public.subscription_status, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.tier, s.status, s.expires_at
  FROM public.subscriptions s
  WHERE s.user_id = _user_id
    AND s.status IN ('trial','active')
    AND s.expires_at > now()
  ORDER BY s.expires_at DESC
  LIMIT 1;
$$;

-- Auto-crear suscripción trial 90 días al crear perfil
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, tier, status, started_at, expires_at)
  VALUES (NEW.id, 'starter', 'trial', now(), now() + interval '90 days')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_create_trial ON public.profiles;
CREATE TRIGGER profiles_create_trial
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_trial_subscription();

-- Backfill: suscripción trial para perfiles existentes sin suscripción
INSERT INTO public.subscriptions (user_id, tier, status, started_at, expires_at)
SELECT p.id, 'starter', 'trial', now(), now() + interval '90 days'
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.id
WHERE s.id IS NULL;

-- =========================================
-- 5. REVIEWS
-- =========================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  author_id uuid NOT NULL,
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, author_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_profile ON public.reviews(profile_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews viewable by everyone"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated can create reviews on others"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = author_id AND auth.uid() <> profile_id);

CREATE POLICY "Authors can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = author_id);

CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: recalcular rating del perfil
CREATE OR REPLACE FUNCTION public.recalc_profile_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _profile_id uuid;
BEGIN
  _profile_id := COALESCE(NEW.profile_id, OLD.profile_id);
  UPDATE public.profiles p
  SET rating_avg = COALESCE((SELECT round(avg(stars)::numeric, 2) FROM public.reviews WHERE profile_id = _profile_id), 0),
      rating_count = (SELECT count(*) FROM public.reviews WHERE profile_id = _profile_id)
  WHERE p.id = _profile_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS reviews_recalc_after_change ON public.reviews;
CREATE TRIGGER reviews_recalc_after_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.recalc_profile_rating();

-- =========================================
-- 6. USER ROLES (admin)
-- =========================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));