-- Helper to compute current active tier for a creator (starter if none active)
CREATE OR REPLACE FUNCTION public._current_tier(_uid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tier::text
       FROM public.subscriptions
      WHERE user_id = _uid
        AND status IN ('trial','active')
        AND expires_at > now()
      ORDER BY expires_at DESC
      LIMIT 1),
    'starter'
  );
$$;

-- Trigger that enforces creator media caps based on the active plan.
CREATE OR REPLACE FUNCTION public.enforce_creator_media_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tier text;
  _pub int;
  _exp int;
  _vid int;
BEGIN
  IF NEW.account_type IS DISTINCT FROM 'creator' THEN
    RETURN NEW;
  END IF;

  _tier := public._current_tier(NEW.id);

  _pub := CASE _tier WHEN 'boost' THEN 3 WHEN 'elite' THEN 6 WHEN 'vip' THEN 10 ELSE 1 END;
  _exp := CASE _tier WHEN 'boost' THEN 3 WHEN 'elite' THEN 6 WHEN 'vip' THEN 10 ELSE 1 END;
  _vid := CASE _tier WHEN 'boost' THEN 1 WHEN 'elite' THEN 2 WHEN 'vip' THEN 5 ELSE 0 END;

  IF NEW.public_photos IS NOT NULL AND array_length(NEW.public_photos, 1) > _pub THEN
    NEW.public_photos := NEW.public_photos[1:_pub];
  END IF;
  IF NEW.exclusive_photos IS NOT NULL AND array_length(NEW.exclusive_photos, 1) > _exp THEN
    NEW.exclusive_photos := NEW.exclusive_photos[1:_exp];
  END IF;
  IF NEW.exclusive_videos IS NOT NULL AND array_length(NEW.exclusive_videos, 1) > _vid THEN
    NEW.exclusive_videos := CASE WHEN _vid = 0 THEN '{}'::text[] ELSE NEW.exclusive_videos[1:_vid] END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_creator_media_limits_trg ON public.profiles;
CREATE TRIGGER enforce_creator_media_limits_trg
BEFORE INSERT OR UPDATE OF public_photos, exclusive_photos, exclusive_videos, account_type
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_creator_media_limits();

-- Backfill existing creator profiles
UPDATE public.profiles p
   SET public_photos = CASE
         WHEN array_length(p.public_photos, 1) IS NULL THEN p.public_photos
         ELSE p.public_photos[1: CASE public._current_tier(p.id)
                                   WHEN 'boost' THEN 3
                                   WHEN 'elite' THEN 6
                                   WHEN 'vip' THEN 10
                                   ELSE 1 END]
       END,
       exclusive_photos = CASE
         WHEN array_length(p.exclusive_photos, 1) IS NULL THEN p.exclusive_photos
         ELSE p.exclusive_photos[1: CASE public._current_tier(p.id)
                                      WHEN 'boost' THEN 3
                                      WHEN 'elite' THEN 6
                                      WHEN 'vip' THEN 10
                                      ELSE 1 END]
       END,
       exclusive_videos = CASE
         WHEN array_length(p.exclusive_videos, 1) IS NULL THEN p.exclusive_videos
         WHEN public._current_tier(p.id) = 'starter' THEN '{}'::text[]
         ELSE p.exclusive_videos[1: CASE public._current_tier(p.id)
                                      WHEN 'boost' THEN 1
                                      WHEN 'elite' THEN 2
                                      WHEN 'vip' THEN 5
                                      ELSE 0 END]
       END
 WHERE p.account_type = 'creator';