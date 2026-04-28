
-- 1) Nuevas columnas en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'visitor',
  ADD COLUMN IF NOT EXISTS verification_selfie_face_url text,
  ADD COLUMN IF NOT EXISTS verification_selfie_id_url text,
  ADD COLUMN IF NOT EXISTS public_photos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exclusive_photos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exclusive_videos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS weight integer,
  ADD COLUMN IF NOT EXISTS hair_color text,
  ADD COLUMN IF NOT EXISTS measurements text,
  ADD COLUMN IF NOT EXISTS work_zone text,
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'es';

-- account_type sólo puede ser visitor o creator
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_account_type_check') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_account_type_check CHECK (account_type IN ('visitor','creator'));
  END IF;
END $$;

-- 2) Bucket privado para contenido exclusivo
INSERT INTO storage.buckets (id, name, public)
VALUES ('exclusive-media', 'exclusive-media', false)
ON CONFLICT (id) DO NOTHING;

-- RLS sobre objetos del bucket exclusive-media
-- Path convention: {user_id}/photos/...  y {user_id}/videos/...
DROP POLICY IF EXISTS "Owners can read exclusive media" ON storage.objects;
DROP POLICY IF EXISTS "Owners can upload exclusive media" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update exclusive media" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete exclusive media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read exclusive media" ON storage.objects;

CREATE POLICY "Owners can read exclusive media"
ON storage.objects FOR SELECT
USING (bucket_id = 'exclusive-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can upload exclusive media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'exclusive-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can update exclusive media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'exclusive-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can delete exclusive media"
ON storage.objects FOR DELETE
USING (bucket_id = 'exclusive-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can read exclusive media"
ON storage.objects FOR SELECT
USING (bucket_id = 'exclusive-media' AND public.has_role(auth.uid(), 'admin'));

-- 3) Admin policies sobre verification-docs (para revisar selfies)
DROP POLICY IF EXISTS "Admins can read verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete verification docs" ON storage.objects;

CREATE POLICY "Admins can read verification docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'verification-docs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete verification docs"
ON storage.objects FOR DELETE
USING (bucket_id = 'verification-docs' AND public.has_role(auth.uid(), 'admin'));

-- Owners can manage their own verification docs
DROP POLICY IF EXISTS "Owners can manage verification docs" ON storage.objects;
CREATE POLICY "Owners can manage verification docs"
ON storage.objects FOR ALL
USING (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4) Función para aprobar verificación y purgar archivos KYC
CREATE OR REPLACE FUNCTION public.approve_verification_and_purge(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id text;
  _face text;
  _idsel text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT verification_id_url, verification_selfie_face_url, verification_selfie_id_url
    INTO _id, _face, _idsel
    FROM public.profiles WHERE id = _user_id;

  -- Marcar como verificado
  UPDATE public.profiles
     SET is_verified = true,
         verification_status = 'approved',
         verification_id_url = NULL,
         verification_selfie_url = NULL,
         verification_selfie_face_url = NULL,
         verification_selfie_id_url = NULL,
         updated_at = now()
   WHERE id = _user_id;

  -- Borrar objetos del bucket
  IF _id IS NOT NULL THEN
    DELETE FROM storage.objects WHERE bucket_id = 'verification-docs' AND name = _id;
  END IF;
  IF _face IS NOT NULL THEN
    DELETE FROM storage.objects WHERE bucket_id = 'verification-docs' AND name = _face;
  END IF;
  IF _idsel IS NOT NULL THEN
    DELETE FROM storage.objects WHERE bucket_id = 'verification-docs' AND name = _idsel;
  END IF;
END;
$$;

-- 5) Función para rechazar verificación
CREATE OR REPLACE FUNCTION public.reject_verification(_user_id uuid, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.profiles
     SET verification_status = 'rejected',
         updated_at = now()
   WHERE id = _user_id;
END;
$$;
