DROP POLICY IF EXISTS "Creator profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Creator profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (
    account_type = 'creator'
    AND is_public_visible = true
    AND is_suspended = false
  );