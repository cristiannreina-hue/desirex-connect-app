-- Trigger que fuerza, en el servidor, los límites de un perfil "visitor":
-- solo se conservan display_name, nickname y una única foto.
-- Cualquier otro intento de escribir campos de creadora se descarta.
CREATE OR REPLACE FUNCTION public.enforce_visitor_profile_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo aplica a visitantes; los creadores conservan sus campos.
  IF NEW.account_type IS DISTINCT FROM 'visitor' THEN
    RETURN NEW;
  END IF;

  -- Limitar fotos públicas a 1
  IF NEW.public_photos IS NOT NULL AND array_length(NEW.public_photos, 1) > 1 THEN
    NEW.public_photos := NEW.public_photos[1:1];
  END IF;
  IF NEW.photos IS NOT NULL AND array_length(NEW.photos, 1) > 1 THEN
    NEW.photos := NEW.photos[1:1];
  END IF;

  -- Borrar todo lo que es exclusivo de creadoras
  NEW.exclusive_photos := '{}'::text[];
  NEW.exclusive_videos := '{}'::text[];
  NEW.services         := '{}'::text[];

  NEW.category        := NULL;
  NEW.service_type    := NULL;
  NEW.description     := NULL;
  NEW.whatsapp        := NULL;
  NEW.telegram        := NULL;

  NEW.age             := NULL;
  NEW.birth_date      := NULL;
  NEW.birth_place     := NULL;
  NEW.height          := NULL;
  NEW.weight          := NULL;
  NEW.hair_color      := NULL;
  NEW.measurements    := NULL;

  NEW.department      := NULL;
  NEW.city            := NULL;
  NEW.work_zone       := NULL;

  NEW.rate_short      := NULL;
  NEW.rate_one_hour   := NULL;
  NEW.rate_two_hours  := NULL;
  NEW.rate_full_day   := NULL;

  -- Visitantes nunca son "destacados" ni se verifican como creadoras
  NEW.is_featured     := false;
  NEW.is_verified     := false;
  NEW.verification_status := 'unverified';
  NEW.verification_id_url := NULL;
  NEW.verification_selfie_url := NULL;
  NEW.verification_selfie_face_url := NULL;
  NEW.verification_selfie_id_url := NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_enforce_visitor_limits ON public.profiles;
CREATE TRIGGER profiles_enforce_visitor_limits
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_visitor_profile_limits();

-- Limpieza inmediata de los visitantes existentes
UPDATE public.profiles
   SET public_photos = CASE
                         WHEN public_photos IS NOT NULL AND array_length(public_photos, 1) > 1
                         THEN public_photos[1:1]
                         ELSE public_photos
                       END,
       photos        = CASE
                         WHEN photos IS NOT NULL AND array_length(photos, 1) > 1
                         THEN photos[1:1]
                         ELSE photos
                       END,
       exclusive_photos = '{}'::text[],
       exclusive_videos = '{}'::text[],
       services         = '{}'::text[],
       category = NULL, service_type = NULL, description = NULL,
       whatsapp = NULL, telegram = NULL,
       age = NULL, birth_date = NULL, birth_place = NULL,
       height = NULL, weight = NULL, hair_color = NULL, measurements = NULL,
       department = NULL, city = NULL, work_zone = NULL,
       rate_short = NULL, rate_one_hour = NULL, rate_two_hours = NULL, rate_full_day = NULL,
       is_featured = false,
       is_verified = false,
       verification_status = 'unverified'
 WHERE account_type = 'visitor';