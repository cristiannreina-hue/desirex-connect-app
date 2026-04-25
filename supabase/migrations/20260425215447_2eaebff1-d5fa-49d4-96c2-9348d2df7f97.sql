-- Crear secuencia que empieza en 1001
CREATE SEQUENCE IF NOT EXISTS public.profile_user_number_seq START WITH 1001;

-- Agregar columna user_number a profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_number INTEGER UNIQUE;

-- Asignar números a perfiles existentes que no tengan
UPDATE public.profiles
SET user_number = nextval('public.profile_user_number_seq')
WHERE user_number IS NULL;

-- Hacer la columna NOT NULL con default desde la secuencia
ALTER TABLE public.profiles
ALTER COLUMN user_number SET DEFAULT nextval('public.profile_user_number_seq'),
ALTER COLUMN user_number SET NOT NULL;

-- Asegurar que la secuencia esté por encima del máximo actual
SELECT setval('public.profile_user_number_seq', GREATEST((SELECT COALESCE(MAX(user_number), 1000) FROM public.profiles), 1000));

-- Índice para búsquedas rápidas por número
CREATE INDEX IF NOT EXISTS idx_profiles_user_number ON public.profiles(user_number);

-- Índice para búsqueda por nombre
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(lower(display_name));

-- Actualizar el trigger handle_new_user para que NO necesite asignar user_number (lo hace el default)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$function$;