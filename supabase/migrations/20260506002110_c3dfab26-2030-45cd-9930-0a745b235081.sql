
-- 1) Reemplazar handle_new_user para no usar el email como display_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _meta_type text;
  _account_type text;
  _meta_name text;
  _safe_name text;
BEGIN
  _meta_type := NEW.raw_user_meta_data->>'account_type';
  _account_type := CASE WHEN _meta_type = 'creator' THEN 'creator' ELSE 'visitor' END;

  _meta_name := NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), '');

  -- Nunca usar el email como display_name (es público)
  IF _meta_name IS NULL OR _meta_name ~* '@' THEN
    _safe_name := 'Usuario ' || substring(NEW.id::text, 1, 8);
  ELSE
    _safe_name := _meta_name;
  END IF;

  INSERT INTO public.profiles (id, display_name, account_type)
  VALUES (NEW.id, _safe_name, _account_type)
  ON CONFLICT (id) DO UPDATE
    SET account_type = EXCLUDED.account_type
    WHERE public.profiles.account_type IS DISTINCT FROM EXCLUDED.account_type;
  RETURN NEW;
END;
$function$;

-- 2) Anonimizar perfiles existentes con email en display_name
UPDATE public.profiles
   SET display_name = 'Usuario ' || substring(id::text, 1, 8),
       updated_at = now()
 WHERE display_name ~* '@';
