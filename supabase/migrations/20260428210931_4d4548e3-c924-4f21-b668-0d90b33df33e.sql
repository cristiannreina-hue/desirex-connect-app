-- 2. Trigger: impedir que un usuario cambie su propio account_type
CREATE OR REPLACE FUNCTION public.protect_account_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.account_type IS DISTINCT FROM OLD.account_type
     AND NOT public.has_role(auth.uid(), 'admin')
  THEN
    RAISE EXCEPTION 'account_type cannot be modified by the user'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_account_type ON public.profiles;
CREATE TRIGGER profiles_protect_account_type
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_account_type();

-- 3. Trigger: sincronizar user_roles con account_type
CREATE OR REPLACE FUNCTION public.sync_user_role_from_account_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_role app_role;
  _old_role app_role;
BEGIN
  _new_role := CASE WHEN NEW.account_type = 'creator' THEN 'provider'::app_role
                    ELSE 'viewer'::app_role END;

  IF TG_OP = 'UPDATE' THEN
    _old_role := CASE WHEN OLD.account_type = 'creator' THEN 'provider'::app_role
                      ELSE 'viewer'::app_role END;
    IF _old_role IS DISTINCT FROM _new_role THEN
      DELETE FROM public.user_roles
       WHERE user_id = NEW.id AND role = _old_role;
    END IF;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _new_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_sync_user_role ON public.profiles;
CREATE TRIGGER profiles_sync_user_role
AFTER INSERT OR UPDATE OF account_type ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_from_account_type();

-- 4. Backfill: sincronizar roles existentes
INSERT INTO public.user_roles (user_id, role)
SELECT id, CASE WHEN account_type = 'creator' THEN 'provider'::app_role
                ELSE 'viewer'::app_role END
  FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;