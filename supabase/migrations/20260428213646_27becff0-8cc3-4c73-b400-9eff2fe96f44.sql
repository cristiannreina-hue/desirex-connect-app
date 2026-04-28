-- 1) Tabla verification_requests
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  photo_url_id text NOT NULL,
  photo_url_selfie text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reject_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vr_status_created
  ON public.verification_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vr_user
  ON public.verification_requests (user_id);

-- Solo una solicitud pendiente por usuario
CREATE UNIQUE INDEX IF NOT EXISTS uniq_vr_pending_per_user
  ON public.verification_requests (user_id) WHERE status = 'pending';

-- updated_at
DROP TRIGGER IF EXISTS trg_vr_updated ON public.verification_requests;
CREATE TRIGGER trg_vr_updated
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own verification request"
  ON public.verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own verification requests"
  ON public.verification_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all verification requests"
  ON public.verification_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update verification requests"
  ON public.verification_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete verification requests"
  ON public.verification_requests FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) Realtime
ALTER TABLE public.verification_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_requests;

-- 4) Función: listar pendientes (admin) con datos del perfil
CREATE OR REPLACE FUNCTION public.list_pending_verifications()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  user_number int,
  photo_url_id text,
  photo_url_selfie text,
  status text,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT vr.id, vr.user_id, p.display_name, p.user_number,
         vr.photo_url_id, vr.photo_url_selfie, vr.status, vr.created_at
    FROM public.verification_requests vr
    LEFT JOIN public.profiles p ON p.id = vr.user_id
   WHERE vr.status = 'pending'
     AND public.has_role(auth.uid(), 'admin')
   ORDER BY vr.created_at ASC;
$$;

-- 5) Aprobar: marca request, marca profile y purga archivos
CREATE OR REPLACE FUNCTION public.approve_verification_request(_request_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage
AS $$
DECLARE
  _r record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO _r FROM public.verification_requests WHERE id = _request_id FOR UPDATE;
  IF _r IS NULL THEN RAISE EXCEPTION 'request not found'; END IF;

  UPDATE public.verification_requests
     SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
   WHERE id = _request_id;

  UPDATE public.profiles
     SET is_verified = true,
         verification_status = 'approved',
         verification_id_url = NULL,
         verification_selfie_url = NULL,
         verification_selfie_face_url = NULL,
         verification_selfie_id_url = NULL,
         updated_at = now()
   WHERE id = _r.user_id;

  -- Purga archivos del bucket
  BEGIN PERFORM storage.delete_object('verification-docs', _r.photo_url_id); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN PERFORM storage.delete_object('verification-docs', _r.photo_url_selfie); EXCEPTION WHEN OTHERS THEN NULL; END;
END;
$$;

-- 6) Rechazar: actualiza request + profile y purga archivos
CREATE OR REPLACE FUNCTION public.reject_verification_request(_request_id uuid, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage
AS $$
DECLARE
  _r record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO _r FROM public.verification_requests WHERE id = _request_id FOR UPDATE;
  IF _r IS NULL THEN RAISE EXCEPTION 'request not found'; END IF;

  UPDATE public.verification_requests
     SET status = 'rejected', reject_reason = _reason,
         reviewed_by = auth.uid(), reviewed_at = now()
   WHERE id = _request_id;

  UPDATE public.profiles
     SET verification_status = 'rejected', updated_at = now()
   WHERE id = _r.user_id;

  BEGIN PERFORM storage.delete_object('verification-docs', _r.photo_url_id); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN PERFORM storage.delete_object('verification-docs', _r.photo_url_selfie); EXCEPTION WHEN OTHERS THEN NULL; END;
END;
$$;

-- 7) Backfill: migrar perfiles con status 'pending' actuales a la nueva tabla
INSERT INTO public.verification_requests (user_id, photo_url_id, photo_url_selfie, status, created_at)
SELECT p.id,
       COALESCE(p.verification_selfie_id_url, p.verification_id_url),
       COALESCE(p.verification_selfie_face_url, p.verification_selfie_url),
       'pending',
       COALESCE(p.verification_submitted_at, now())
  FROM public.profiles p
 WHERE p.verification_status = 'pending'
   AND COALESCE(p.verification_selfie_id_url, p.verification_id_url) IS NOT NULL
   AND COALESCE(p.verification_selfie_face_url, p.verification_selfie_url) IS NOT NULL
ON CONFLICT DO NOTHING;

-- 8) Limpiar verification_requests cuando se borra un perfil
CREATE OR REPLACE FUNCTION public.cleanup_profile_on_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage
AS $$
DECLARE
  _uid text := OLD.id::text;
  _obj record;
BEGIN
  FOR _obj IN
    SELECT bucket_id, name FROM storage.objects
     WHERE bucket_id IN ('profile-photos','exclusive-media','verification-docs')
       AND ( (storage.foldername(name))[1] = _uid
             OR name LIKE _uid || '/%'
             OR name = OLD.verification_id_url
             OR name = OLD.verification_selfie_url
             OR name = OLD.verification_selfie_face_url
             OR name = OLD.verification_selfie_id_url )
  LOOP
    BEGIN PERFORM storage.delete_object(_obj.bucket_id, _obj.name); EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;

  DELETE FROM public.verification_requests WHERE user_id = OLD.id;
  DELETE FROM public.reviews        WHERE profile_id = OLD.id OR author_id = OLD.id;
  DELETE FROM public.subscriptions  WHERE user_id = OLD.id;
  DELETE FROM public.payments       WHERE user_id = OLD.id;
  DELETE FROM public.weekly_rewards WHERE user_id = OLD.id;
  DELETE FROM public.user_roles     WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$;