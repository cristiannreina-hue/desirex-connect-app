-- 1) handle_new_user ahora respeta account_type desde la metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _meta_type text;
  _account_type text;
BEGIN
  _meta_type := NEW.raw_user_meta_data->>'account_type';
  _account_type := CASE WHEN _meta_type = 'creator' THEN 'creator' ELSE 'visitor' END;

  INSERT INTO public.profiles (id, display_name, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    _account_type
  )
  ON CONFLICT (id) DO UPDATE
    SET account_type = EXCLUDED.account_type
    WHERE public.profiles.account_type IS DISTINCT FROM EXCLUDED.account_type;
  RETURN NEW;
END;
$function$;

-- 2) protect_account_type debe permitir el INSERT que viene del trigger handle_new_user
-- (ese trigger corre como SECURITY DEFINER con session_user = postgres / supabase_auth_admin,
--  y auth.uid() puede ser NULL). Solo bloqueamos cuando hay un usuario autenticado intentando
--  promoverse a sí mismo.
CREATE OR REPLACE FUNCTION public.protect_account_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Solo restringir si hay un auth.uid() (usuario haciendo el insert por su cuenta).
    -- Cuando handle_new_user crea el perfil, auth.uid() es NULL y se respeta el valor.
    IF auth.uid() IS NOT NULL
       AND NEW.account_type IS DISTINCT FROM 'visitor'
       AND NOT public.has_role(auth.uid(), 'admin')
    THEN
      NEW.account_type := 'visitor';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.account_type IS DISTINCT FROM OLD.account_type
     AND NOT public.has_role(auth.uid(), 'admin')
  THEN
    NEW.account_type := OLD.account_type;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3) Asegurar trigger de auth conectado a handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();