
-- ============ EXTENSIONES (para pg_cron en entrega 3b) ============
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============ ENUM ESTADO PAGO ============
DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('PENDING','APPROVED','DECLINED','VOIDED','ERROR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ TABLA payments ============
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reference text NOT NULL UNIQUE,
  tier public.subscription_tier NOT NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'COP',
  status public.payment_status NOT NULL DEFAULT 'PENDING',
  wompi_transaction_id text,
  wompi_payment_method text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_user_idx ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Users can create own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ TABLA wompi_events (bitácora webhook) ============
CREATE TABLE IF NOT EXISTS public.wompi_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE,
  event_type text,
  reference text,
  raw jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wompi_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins view wompi events"
  ON public.wompi_events FOR SELECT
  USING (public.has_role(auth.uid(),'admin'));

-- ============ TABLA weekly_rewards ============
CREATE TABLE IF NOT EXISTS public.weekly_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  position smallint NOT NULL CHECK (position BETWEEN 1 AND 3),
  days_awarded integer NOT NULL,
  bonus_month boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE public.weekly_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weekly rewards"
  ON public.weekly_rewards FOR SELECT
  USING (true);

-- ============ FUNCIÓN: extender o crear suscripción ============
CREATE OR REPLACE FUNCTION public.extend_subscription(
  _user_id uuid,
  _tier public.subscription_tier,
  _days integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing record;
  _base timestamptz;
BEGIN
  SELECT * INTO _existing FROM public.subscriptions
   WHERE user_id = _user_id
   ORDER BY expires_at DESC
   LIMIT 1;

  IF _existing IS NULL THEN
    INSERT INTO public.subscriptions (user_id, tier, status, started_at, expires_at)
    VALUES (_user_id, _tier, 'active', now(), now() + (_days || ' days')::interval);
    RETURN;
  END IF;

  _base := GREATEST(_existing.expires_at, now());

  UPDATE public.subscriptions
     SET tier = _tier,
         status = 'active',
         expires_at = _base + (_days || ' days')::interval,
         updated_at = now()
   WHERE id = _existing.id;
END $$;

-- ============ FUNCIÓN: premiar Top 3 semanal ============
CREATE OR REPLACE FUNCTION public.award_weekly_top()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _week_start date := date_trunc('week', now())::date;
  _rec record;
  _streak int;
  _days int;
BEGIN
  -- Top 3 según vistas + reseñas en perfiles activos
  FOR _rec IN
    SELECT p.id AS user_id,
           ROW_NUMBER() OVER (
             ORDER BY (p.view_count * 0.6 + p.rating_avg * p.rating_count * 0.4) DESC
           ) AS pos
      FROM public.profiles p
      JOIN public.subscriptions s ON s.user_id = p.id
     WHERE s.status IN ('trial','active')
       AND s.expires_at > now()
     LIMIT 3
  LOOP
    _days := CASE _rec.pos WHEN 1 THEN 7 WHEN 2 THEN 5 ELSE 3 END;

    -- ¿3 semanas seguidas en top 3?
    SELECT count(*) INTO _streak
      FROM public.weekly_rewards
     WHERE user_id = _rec.user_id
       AND week_start >= (_week_start - interval '14 days');

    INSERT INTO public.weekly_rewards (user_id, week_start, position, days_awarded, bonus_month)
    VALUES (_rec.user_id, _week_start, _rec.pos, _days, _streak >= 2)
    ON CONFLICT (user_id, week_start) DO NOTHING;

    PERFORM public.extend_subscription(
      _rec.user_id,
      (SELECT tier FROM public.subscriptions WHERE user_id = _rec.user_id ORDER BY expires_at DESC LIMIT 1),
      _days + CASE WHEN _streak >= 2 THEN 30 ELSE 0 END
    );
  END LOOP;
END $$;
