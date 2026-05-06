-- Trigger to protect verification fields from being self-modified by users
CREATE OR REPLACE FUNCTION public.protect_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean := false;
  _is_service boolean := (auth.role() = 'service_role');
BEGIN
  IF auth.uid() IS NOT NULL THEN
    _is_admin := public.has_role(auth.uid(), 'admin');
  END IF;

  -- Service role and admins can modify anything
  IF _is_service OR _is_admin THEN
    RETURN NEW;
  END IF;

  -- For everyone else, force protected fields to keep their old values
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    NEW.is_verified := OLD.is_verified;
  END IF;

  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    NEW.verification_status := OLD.verification_status;
  END IF;

  IF NEW.verification_submitted_at IS DISTINCT FROM OLD.verification_submitted_at THEN
    NEW.verification_submitted_at := OLD.verification_submitted_at;
  END IF;

  -- Allow users to clear their own document URLs (set to NULL) but not set/change them
  IF NEW.verification_id_url IS DISTINCT FROM OLD.verification_id_url
     AND NEW.verification_id_url IS NOT NULL THEN
    NEW.verification_id_url := OLD.verification_id_url;
  END IF;

  IF NEW.verification_selfie_url IS DISTINCT FROM OLD.verification_selfie_url
     AND NEW.verification_selfie_url IS NOT NULL THEN
    NEW.verification_selfie_url := OLD.verification_selfie_url;
  END IF;

  IF NEW.verification_selfie_face_url IS DISTINCT FROM OLD.verification_selfie_face_url
     AND NEW.verification_selfie_face_url IS NOT NULL THEN
    NEW.verification_selfie_face_url := OLD.verification_selfie_face_url;
  END IF;

  IF NEW.verification_selfie_id_url IS DISTINCT FROM OLD.verification_selfie_id_url
     AND NEW.verification_selfie_id_url IS NOT NULL THEN
    NEW.verification_selfie_id_url := OLD.verification_selfie_id_url;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_verification_fields_trg ON public.profiles;
CREATE TRIGGER protect_verification_fields_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_verification_fields();