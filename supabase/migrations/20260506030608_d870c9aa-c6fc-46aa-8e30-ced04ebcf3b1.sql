-- Update handle_new_user to also populate birth_date and computed age from signup metadata
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
  _birth date;
  _age int;
BEGIN
  _meta_type := NEW.raw_user_meta_data->>'account_type';
  _account_type := CASE WHEN _meta_type = 'creator' THEN 'creator' ELSE 'visitor' END;

  _meta_name := NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), '');
  IF _meta_name IS NULL OR _meta_name ~* '@' THEN
    _safe_name := 'Usuario ' || substring(NEW.id::text, 1, 8);
  ELSE
    _safe_name := _meta_name;
  END IF;

  -- Parse birth_date from signup metadata (verified at signup)
  BEGIN
    _birth := NULLIF(NEW.raw_user_meta_data->>'birth_date','')::date;
  EXCEPTION WHEN OTHERS THEN
    _birth := NULL;
  END;

  IF _birth IS NOT NULL THEN
    _age := date_part('year', age(_birth))::int;
  ELSE
    _age := NULL;
  END IF;

  INSERT INTO public.profiles (id, display_name, account_type, birth_date, age)
  VALUES (NEW.id, _safe_name, _account_type, _birth, _age)
  ON CONFLICT (id) DO UPDATE
    SET account_type = EXCLUDED.account_type,
        birth_date = COALESCE(public.profiles.birth_date, EXCLUDED.birth_date),
        age = COALESCE(public.profiles.age, EXCLUDED.age)
    WHERE public.profiles.account_type IS DISTINCT FROM EXCLUDED.account_type
       OR public.profiles.birth_date IS NULL
       OR public.profiles.age IS NULL;
  RETURN NEW;
END;
$function$;

-- Backfill: for existing creators missing age, compute from birth_date
UPDATE public.profiles
   SET age = date_part('year', age(birth_date))::int
 WHERE age IS NULL AND birth_date IS NOT NULL;