CREATE OR REPLACE FUNCTION public.approve_verification_request(_request_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'storage'
AS $function$
DECLARE
  _r record;
  _email text;
  _rows int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO _r FROM public.verification_requests WHERE id = _request_id FOR UPDATE;
  IF _r IS NULL THEN RAISE EXCEPTION 'request not found'; END IF;

  UPDATE public.verification_requests
     SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
   WHERE id = _request_id;

  -- Aplicar sello al perfil correcto (por user_id)
  UPDATE public.profiles
     SET is_verified = true,
         verification_status = 'approved',
         verification_id_url = NULL,
         verification_selfie_url = NULL,
         verification_selfie_face_url = NULL,
         verification_selfie_id_url = NULL,
         updated_at = now()
   WHERE id = _r.user_id;

  GET DIAGNOSTICS _rows = ROW_COUNT;

  -- Si el perfil no existía aún, crearlo verificado
  IF _rows = 0 THEN
    SELECT email INTO _email FROM auth.users WHERE id = _r.user_id;
    INSERT INTO public.profiles (id, display_name, is_verified, verification_status)
    VALUES (_r.user_id, COALESCE(_email, 'Usuario'), true, 'approved')
    ON CONFLICT (id) DO UPDATE
       SET is_verified = true, verification_status = 'approved', updated_at = now();
  END IF;

  -- Purga archivos del bucket
  BEGIN PERFORM storage.delete_object('verification-docs', _r.photo_url_id); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN PERFORM storage.delete_object('verification-docs', _r.photo_url_selfie); EXCEPTION WHEN OTHERS THEN NULL; END;
END;
$function$;