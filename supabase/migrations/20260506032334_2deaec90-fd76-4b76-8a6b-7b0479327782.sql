ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_public_visible boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS profiles_creator_visible_idx
  ON public.profiles (account_type, is_public_visible)
  WHERE account_type = 'creator';