
-- 1) Defense in depth: force verification url columns to always be NULL on the profiles table.
--    Real verification data lives in verification_requests; these columns on profiles must never hold paths.
CREATE OR REPLACE FUNCTION public.force_null_profile_verification_urls()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.verification_id_url := NULL;
  NEW.verification_selfie_url := NULL;
  NEW.verification_selfie_face_url := NULL;
  NEW.verification_selfie_id_url := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_force_null_profile_verification_urls ON public.profiles;
CREATE TRIGGER trg_force_null_profile_verification_urls
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.force_null_profile_verification_urls();

-- Clean any existing residue
UPDATE public.profiles
   SET verification_id_url = NULL,
       verification_selfie_url = NULL,
       verification_selfie_face_url = NULL,
       verification_selfie_id_url = NULL
 WHERE verification_id_url IS NOT NULL
    OR verification_selfie_url IS NOT NULL
    OR verification_selfie_face_url IS NOT NULL
    OR verification_selfie_id_url IS NOT NULL;

-- 2) Column-level privilege hardening.
--    Anonymous visitors cannot read birth_date, birth_place, or any verification url columns.
--    Authenticated users cannot read the verification url columns either (only service_role / SECURITY DEFINER admin functions).
REVOKE SELECT (
  birth_date,
  birth_place,
  verification_id_url,
  verification_selfie_url,
  verification_selfie_face_url,
  verification_selfie_id_url
) ON public.profiles FROM anon;

REVOKE SELECT (
  verification_id_url,
  verification_selfie_url,
  verification_selfie_face_url,
  verification_selfie_id_url
) ON public.profiles FROM authenticated;
