-- Reconectar el trigger en auth.users para que handle_new_user cree el perfil
-- con el account_type correcto (visitor/creator) leído desde la metadata del signup.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: asegurar que cada perfil existente tenga su rol correspondiente
-- en user_roles según su account_type actual.
INSERT INTO public.user_roles (user_id, role)
SELECT p.id,
       CASE WHEN p.account_type = 'creator' THEN 'provider'::app_role
            ELSE 'viewer'::app_role END
FROM public.profiles p
ON CONFLICT (user_id, role) DO NOTHING;

-- Limpiar roles incoherentes: si alguien es visitor no debería tener 'provider'
DELETE FROM public.user_roles ur
USING public.profiles p
WHERE ur.user_id = p.id
  AND p.account_type = 'visitor'
  AND ur.role = 'provider'::app_role;

-- Y al revés: si es creator no debería tener 'viewer'
DELETE FROM public.user_roles ur
USING public.profiles p
WHERE ur.user_id = p.id
  AND p.account_type = 'creator'
  AND ur.role = 'viewer'::app_role;