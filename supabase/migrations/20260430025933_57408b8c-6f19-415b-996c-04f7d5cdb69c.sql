-- 1) Trial solo para creadores
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.account_type IS DISTINCT FROM 'creator' THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.subscriptions (user_id, tier, status, started_at, expires_at)
  VALUES (NEW.id, 'starter', 'trial', now(), now() + interval '90 days')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 2) Bloquear suscripciones de visitantes
CREATE OR REPLACE FUNCTION public.block_visitor_subscriptions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _acc text;
BEGIN
  SELECT account_type INTO _acc FROM public.profiles WHERE id = NEW.user_id;
  IF _acc IS DISTINCT FROM 'creator' THEN
    RAISE EXCEPTION 'Las cuentas de visitante no pueden tener suscripciones'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_block_visitor_subscriptions ON public.subscriptions;
CREATE TRIGGER trg_block_visitor_subscriptions
BEFORE INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.block_visitor_subscriptions();

-- 3) Limpiar suscripciones existentes de visitantes
DELETE FROM public.subscriptions s
USING public.profiles p
WHERE p.id = s.user_id
  AND p.account_type IS DISTINCT FROM 'creator';
