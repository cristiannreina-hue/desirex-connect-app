CREATE OR REPLACE FUNCTION public.cleanup_profile_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  _uid text := OLD.id::text;
  _obj record;
BEGIN
  -- Borrar archivos del usuario en los 3 buckets vía API oficial de Storage.
  FOR _obj IN
    SELECT bucket_id, name
      FROM storage.objects
     WHERE bucket_id IN ('profile-photos', 'exclusive-media', 'verification-docs')
       AND (
         (storage.foldername(name))[1] = _uid
         OR name LIKE _uid || '/%'
         OR name = OLD.verification_id_url
         OR name = OLD.verification_selfie_url
         OR name = OLD.verification_selfie_face_url
         OR name = OLD.verification_selfie_id_url
       )
  LOOP
    BEGIN
      PERFORM storage.delete_object(_obj.bucket_id, _obj.name);
    EXCEPTION WHEN OTHERS THEN
      -- Si un objeto no se puede borrar, seguimos con el resto.
      NULL;
    END;
  END LOOP;

  -- Datos relacionados
  DELETE FROM public.reviews        WHERE profile_id = OLD.id OR author_id = OLD.id;
  DELETE FROM public.subscriptions  WHERE user_id = OLD.id;
  DELETE FROM public.payments       WHERE user_id = OLD.id;
  DELETE FROM public.weekly_rewards WHERE user_id = OLD.id;
  DELETE FROM public.user_roles     WHERE user_id = OLD.id;

  RETURN OLD;
END;
$$;