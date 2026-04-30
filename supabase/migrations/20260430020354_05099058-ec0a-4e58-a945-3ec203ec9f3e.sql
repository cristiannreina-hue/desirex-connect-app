CREATE OR REPLACE FUNCTION public.protect_account_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- En INSERT, si no es admin, forzar a 'visitor'
    IF NEW.account_type IS DISTINCT FROM 'visitor'
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
    -- Bloquear cualquier cambio de tipo por parte del usuario
    NEW.account_type := OLD.account_type;
  END IF;
  RETURN NEW;
END;
$function$;

-- Asegurar que el trigger se dispare en INSERT y UPDATE
DROP TRIGGER IF EXISTS profiles_protect_account_type ON public.profiles;
CREATE TRIGGER profiles_protect_account_type
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_account_type();