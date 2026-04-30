-- Reemplazar la política pública para que NO exponga perfiles de visitantes.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- 1) El público (anónimo o autenticado) solo ve perfiles de creadoras.
CREATE POLICY "Creator profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (account_type = 'creator');

-- 2) Cada usuario puede ver siempre su propio perfil (visitante o creadora).
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 3) Los administradores pueden ver todos los perfiles para moderación.
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));